import React, { useState } from 'react';
import { extractYouTubeVideoId } from '../utils/youtube';
import { X, Upload, Music } from 'lucide-react';

interface SingleTrackLoaderModalProps {
  isOpen: boolean;
  deckId: 'A' | 'B';
  currentTitle: string;
  onClose: () => void;
  onLoadTrack: (trackData: { videoId: string; title: string; bpm: number }) => void;
  onOpenDownloader?: () => void;
}

export const SingleTrackLoaderModal: React.FC<SingleTrackLoaderModalProps> = ({
  isOpen,
  deckId,
  currentTitle,
  onClose,
  onLoadTrack,
  onOpenDownloader,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState('120');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      setError('Please provide a valid YouTube URL (watch, shorts, youtu.be) or 11-character video ID.');
      return;
    }

    onLoadTrack({
      videoId,
      title: title.trim() || `YouTube Track (${videoId})`,
      bpm: parseFloat(bpm) || 120,
    });

    onClose();
  };

  const isDeckA = deckId === 'A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDeckA ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
            />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Load Track to Deck {deckId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              YouTube Video URL or ID *
            </label>
            <input
              type="text"
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Track Name (Optional)
            </label>
            <input
              type="text"
              placeholder="Title / Artist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Initial BPM
            </label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              className="w-28 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
            />
          </div>

          {/* Quick presets for this deck */}
          <div className="pt-2 border-t border-zinc-800">
            {onOpenDownloader && (
              <div className="mb-2.5 p-2 rounded bg-cyan-950/40 border border-cyan-800 flex items-center justify-between">
                <span className="text-[11px] text-cyan-300">
                  Want direct streams or local files?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDownloader();
                  }}
                  className="px-2 py-1 rounded bg-cyan-500 text-black font-bold text-[10px] uppercase hover:bg-cyan-400"
                >
                  Open ytDownloader
                </button>
              </div>
            )}
            <span className="text-[10px] text-zinc-500 block mb-1.5 uppercase font-bold">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Around The World (Daft Punk)', id: 'k5wh1a92eY0', bpm: 121 },
                { name: 'D.A.N.C.E. (Justice)', id: 'sy1dYFGkPUE', bpm: 114 },
                { name: 'Blinding Lights (The Weeknd)', id: '4NRXx6U8ABQ', bpm: 171 },
                { name: 'Levitating (Dua Lipa)', id: 'TUVcZfQe-Kw', bpm: 103 },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setUrl(s.id);
                    setTitle(s.name);
                    setBpm(s.bpm.toString());
                  }}
                  className="px-2 py-1 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                isDeckA
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-black'
                  : 'bg-amber-400 hover:bg-amber-300 text-black'
              }`}
            >
              Load into Deck {deckId}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
