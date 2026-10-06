import React, { useState } from 'react';
import { MediaFormat } from '../types/dj';
import { formatSecondsToMS } from '../utils/youtube';
import {
  Download,
  Play,
  Sparkles,
  FileVideo,
  FileAudio,
  Copy,
  Check,
  X,
  ExternalLink,
  HardDrive,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';

interface YtDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadToDeck: (
    deckId: 'A' | 'B',
    trackData: {
      videoId: string;
      title: string;
      artist: string;
      thumbnail: string;
      duration: number;
      directStreamUrl?: string;
      audioStreamUrl?: string;
      isLocalFile?: boolean;
      formats?: MediaFormat[];
      ytdlpCommand?: string;
    }
  ) => void;
}

export const YtDownloaderModal: React.FC<YtDownloaderModalProps> = ({
  isOpen,
  onClose,
  onLoadToDeck,
}) => {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=k5wh1a92eY0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grabbedData, setGrabbedData] = useState<any>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'grabber' | 'local'>('grabber');

  if (!isOpen) return null;

  const handleGrab = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setGrabbedData(null);

    try {
      const res = await fetch('/api/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to extract video streams');
      }

      setGrabbedData(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with ytDownloader stream engine');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  // Handle local file drop or selection (for files downloaded via ytDownloader)
  const handleLocalFileSelect = (deckId: 'A' | 'B', file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    onLoadToDeck(deckId, {
      videoId: 'local_' + Date.now(),
      title: fileName,
      artist: 'Local Media (ytDownloader)',
      thumbnail: '',
      duration: 180, // will auto-update on loadedmetadata
      directStreamUrl: objectUrl,
      isLocalFile: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Download className="w-4 h-4 text-black font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>ytDownloader Stream & Media Grabber</span>
                <span className="text-[10px] font-mono font-normal text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  v2.0 Engine
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Direct stream extractor powered by ytDownloader / yt-dlp architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('grabber')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'grabber'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>URL Stream Grabber</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'local'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Load Local ytDownloader File (.mp4 / .mp3)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'grabber' ? (
            <>
              {/* URL Input Form */}
              <form onSubmit={handleGrab} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube, Vimeo, or Shorts link (e.g. https://www.youtube.com/watch?v=...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? 'Grabbing...' : 'Grab Streams'}</span>
                </button>
              </form>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Grabbed Video Metadata & Formats */}
              {grabbedData && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                  {/* Media Info Card */}
                  <div className="flex gap-4 items-start">
                    {grabbedData.thumbnail && (
                      <img
                        src={grabbedData.thumbnail}
                        alt="Thumbnail"
                        className="w-36 aspect-video object-cover rounded-lg border border-zinc-800 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {grabbedData.hasDirectStream ? 'Direct HTML5 Stream Available' : 'IFrame Compatible'}
                        </span>
                        {grabbedData.duration > 0 && (
                          <span className="text-xs font-mono-numbers text-zinc-400">
                            {formatSecondsToMS(grabbedData.duration)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white truncate" title={grabbedData.title}>
                        {grabbedData.title}
                      </h3>
                      <p className="text-xs text-zinc-400">{grabbedData.author}</p>

                      {/* 1-Click Load into Deck Buttons */}
                      <div className="flex items-center gap-2.5 mt-3">
                        <button
                          onClick={() => {
                            onLoadToDeck('A', {
                              videoId: grabbedData.videoId,
                              title: grabbedData.title,
                              artist: grabbedData.author,
                              thumbnail: grabbedData.thumbnail,
                              duration: grabbedData.duration,
                              directStreamUrl: grabbedData.bestVideoStream?.proxyUrl || null,
                              audioStreamUrl: grabbedData.bestAudioStream?.proxyUrl || null,
                              formats: grabbedData.formats,
                              ytdlpCommand: grabbedData.ytdlpCommand,
                            });
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-md bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Load to Deck A</span>
                        </button>

                        <button
                          onClick={() => {
                            onLoadToDeck('B', {
                              videoId: grabbedData.videoId,
                              title: grabbedData.title,
                              artist: grabbedData.author,
                              thumbnail: grabbedData.thumbnail,
                              duration: grabbedData.duration,
                              directStreamUrl: grabbedData.bestVideoStream?.proxyUrl || null,
                              audioStreamUrl: grabbedData.bestAudioStream?.proxyUrl || null,
                              formats: grabbedData.formats,
                              ytdlpCommand: grabbedData.ytdlpCommand,
                            });
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-md bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Load to Deck B</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Available Streams / Formats (yt-dlp style table) */}
                  {grabbedData.formats && grabbedData.formats.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                        Available Media Streams ({grabbedData.formats.length})
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {grabbedData.formats.slice(0, 8).map((fmt: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {fmt.type === 'video' ? (
                                <FileVideo className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <FileAudio className="w-4 h-4 text-purple-400" />
                              )}
                              <span className="font-bold text-zinc-200">{fmt.quality}</span>
                              <span className="text-zinc-500 uppercase">({fmt.container})</span>
                              {fmt.fps && <span className="text-zinc-500">{fmt.fps}fps</span>}
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={fmt.url}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* yt-dlp CLI Command Snippet */}
                  {grabbedData.ytdlpCommand && (
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-cyan-400" />
                          <span>yt-dlp Terminal Command:</span>
                        </span>
                        <button
                          onClick={() => handleCopyCmd(grabbedData.ytdlpCommand)}
                          className="hover:text-white flex items-center gap-1 text-[10px]"
                        >
                          {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2 bg-black rounded font-mono text-[11px] text-zinc-300 break-all select-all border border-zinc-800">
                        {grabbedData.ytdlpCommand}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Local File Dropper for ytDownloader Desktop downloads */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                <HardDrive className="w-10 h-10 mx-auto text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Load Local Audio/Video Files Downloaded with ytDownloader
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    Select any `.mp4`, `.webm`, `.mp3`, `.wav`, or `.m4a` file from your computer.
                    Direct files bypass network latency, enabling instant zero-lag scratching and true Web Audio API EQ!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 max-w-md mx-auto">
                  <label className="p-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5">
                    <span className="text-xs font-bold text-cyan-300 uppercase">Load to Deck A</span>
                    <span className="text-[10px] text-zinc-400">Choose file...</span>
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalFileSelect('A', file);
                      }}
                    />
                  </label>

                  <label className="p-3 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5">
                    <span className="text-xs font-bold text-amber-300 uppercase">Load to Deck B</span>
                    <span className="text-[10px] text-zinc-400">Choose file...</span>
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalFileSelect('B', file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
