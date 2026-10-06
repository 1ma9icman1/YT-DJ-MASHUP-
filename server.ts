import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// List of public Invidious API instances for extracting streams (yt-dlp web equivalent)
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
  'https://invidious.projectsegfau.lt',
  'https://invidious.flokinet.to',
];

function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );
  return match ? match[1] : null;
}

// API: Grab video details and streams like ytDownloader (yt-dlp GUI)
app.post('/api/grab', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Could not extract valid video ID from URL' });
    }

    // First, try oEmbed as guaranteed metadata fallback
    let title = `YouTube Track (${videoId})`;
    let author = 'YouTube Creator';
    let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
        author = oembedData.author_name || author;
        thumbnail = oembedData.thumbnail_url || thumbnail;
      }
    } catch {}

    // Try invidious instances to grab formats like yt-dlp does
    let videoData: any = null;
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const invRes = await fetch(`${instance}/api/v1/videos/${videoId}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ytDownloader/2.0',
          },
        });
        clearTimeout(timeout);

        if (invRes.ok) {
          videoData = await invRes.json();
          break;
        }
      } catch {
        // try next instance
      }
    }

    if (videoData) {
      title = videoData.title || title;
      author = videoData.author || author;
      const duration = videoData.lengthSeconds || 0;

      // Extract video and audio formats
      const formatStreams = (videoData.formatStreams || []).map((f: any) => ({
        quality: f.qualityLabel || f.resolution || 'Standard',
        container: f.container || 'mp4',
        type: 'video',
        url: f.url,
        proxyUrl: `/api/proxy-stream?url=${encodeURIComponent(f.url)}`,
        size: f.size || null,
        fps: f.fps || 30,
      }));

      const adaptiveFormats = (videoData.adaptiveFormats || []).map((f: any) => ({
        quality: f.qualityLabel || (f.type?.includes('audio') ? `${Math.round(f.bitrate / 1000)}kbps Audio` : f.resolution),
        container: f.container || (f.type?.includes('audio') ? 'm4a' : 'webm'),
        type: f.type?.includes('audio') ? 'audio' : 'video',
        url: f.url,
        proxyUrl: `/api/proxy-stream?url=${encodeURIComponent(f.url)}`,
        bitrate: f.bitrate,
      }));

      const bestVideoStream = formatStreams[0] || adaptiveFormats.find((f: any) => f.type === 'video');
      const bestAudioStream = adaptiveFormats.find((f: any) => f.type === 'audio') || bestVideoStream;

      return res.json({
        success: true,
        videoId,
        title,
        author,
        duration,
        thumbnail,
        hasDirectStream: true,
        bestVideoStream,
        bestAudioStream,
        formats: [...formatStreams, ...adaptiveFormats],
        ytdlpCommand: `yt-dlp -f "bestvideo+bestaudio/best" https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    // Fallback if public instances are rate limited: return metadata + iframe fallback
    return res.json({
      success: true,
      videoId,
      title,
      author,
      duration: 180,
      thumbnail,
      hasDirectStream: false,
      formats: [],
      ytdlpCommand: `yt-dlp -f "bestvideo+bestaudio/best" https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to grab video data' });
  }
});

// API: Proxy stream with HTTP 206 Partial Content (Range requests) for smooth HTML5 video seeking
app.get('/api/proxy-stream', async (req: Request, res: Response) => {
  try {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      return res.status(400).send('Stream URL required');
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ytDownloader/2.0',
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const mediaRes = await fetch(streamUrl, { headers });

    res.status(mediaRes.status);
    mediaRes.headers.forEach((val, key) => {
      // Forward necessary streaming headers
      if (['content-type', 'content-length', 'content-range', 'accept-ranges'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    if (!mediaRes.body) {
      return res.end();
    }

    // Pipe response stream
    const reader = mediaRes.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } catch {
        res.end();
      }
    };
    pump();
  } catch (err) {
    res.status(500).send('Streaming proxy error');
  }
});

// Vite integration or static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`DJ YouTube Mashup Server (ytDownloader powered) listening on port ${PORT}`);
  });
}

startServer();
