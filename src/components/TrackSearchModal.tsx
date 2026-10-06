import React, { useState, useEffect } from 'react';
import { Search, Play, X, Music, RefreshCw, Zap, Clock, ExternalLink } from 'lucide-react';
import { formatSecondsToMS } from '../utils/youtube';

interface SearchResultItem {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  bpm?: number;
}

interface TrackSearchModalProps {
  isOpen: boolean;
  deckId: 'A' | 'B';
  onClose: () => void;
  onSelectTrack: (trackData: { videoId: string; title: string; bpm: number; thumbnail?: string; artist?: string }) => void;
}

const QUICK_TAGS = [
  'Daft Punk',
  'Justice DANCE',
  'Queen Another One Bites The Dust',
  'The Weeknd Blinding Lights',
  'Dua Lipa Levitating',
  'Bruno Mars Uptown Funk',
  'Lofi Hip Hop Chill',
  'Cyberpunk Synthwave',
  'House Drum Loop 124 BPM',
  'Acapella Stems',
];

export const TrackSearchModal: React.FC<TrackSearchModalProps> = ({
  isOpen,
  deckId,
  onClose,
  onSelectTrack,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDeckA = deckId === 'A';
  const themeColor = isDeckA ? 'cyan' : 'amber';

  const handleSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results) {
        // Add random natural BPM within typical dance/mashup range for preview if not present
        const processed = data.results.map((r: any) => ({
          ...r,
          bpm: r.bpm || Math.floor(100 + (parseInt(r.videoId.slice(0, 2), 36) % 35)),
        }));
        setResults(processed);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      setError('Search request failed. Please check connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  // Perform initial search when modal opens if query is empty
  useEffect(() => {
    if (isOpen && results.length === 0) {
      handleSearch('Daft Punk Mashup');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${
                isDeckA
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              }`}
            >
              <Search className="w-4 h-4 font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Search YouTube Tracks & Mashups</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    isDeckA
                      ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  FOR DECK {deckId}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Find songs, acapellas, instrumentals, and loops to mashup instantly
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

        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search artist, song, remix, or BPM (e.g. 'Daft Punk', 'Queen', 'Disco House')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                isDeckA
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              }`}
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Quick Tag Recommendations */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] text-zinc-500 uppercase font-bold shrink-0">Suggestions:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  handleSearch(tag);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap border border-zinc-700/80 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-zinc-500 space-y-2">
              <Music className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm">No tracks found matching your search.</p>
              <p className="text-xs text-zinc-600">Try searching for an artist, track title, or genre!</p>
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.videoId}
              className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between gap-4 group"
            >
              {/* Thumbnail & Title */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono-numbers text-zinc-300">
                    {formatSecondsToMS(item.duration)}
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono-numbers text-zinc-500">
                      ~{item.bpm} BPM
                    </span>
                    <span className="text-[10px] text-zinc-600">·</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      ID: {item.videoId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: 1-Click Load into Deck */}
              <button
                onClick={() => {
                  onSelectTrack({
                    videoId: item.videoId,
                    title: item.title,
                    artist: item.author,
                    thumbnail: item.thumbnail,
                    bpm: item.bpm || 120,
                  });
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all shadow-md ${
                  isDeckA
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Load to Deck {deckId}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
