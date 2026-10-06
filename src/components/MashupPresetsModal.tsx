import React, { useState } from 'react';
import { MashupPreset } from '../types/dj';
import { DEFAULT_MASHUP_PRESETS } from '../data/mashups';
import { extractYouTubeVideoId } from '../utils/youtube';
import { X, Sparkles, Music2, Play, Search, ArrowRight, ExternalLink } from 'lucide-react';

interface MashupPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: MashupPreset) => void;
  onLoadCustomPair: (deckAData: { videoId: string; title: string; bpm: number }, deckBData: { videoId: string; title: string; bpm: number }) => void;
}

export const MashupPresetsModal: React.FC<MashupPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onLoadCustomPair,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Custom pair form state
  const [customUrlA, setCustomUrlA] = useState('');
  const [customTitleA, setCustomTitleA] = useState('');
  const [customBpmA, setCustomBpmA] = useState('120');

  const [customUrlB, setCustomUrlB] = useState('');
  const [customTitleB, setCustomTitleB] = useState('');
  const [customBpmB, setCustomBpmB] = useState('120');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPresets = DEFAULT_MASHUP_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.deckA.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.deckB.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const idA = extractYouTubeVideoId(customUrlA);
    const idB = extractYouTubeVideoId(customUrlB);

    if (!idA) {
      setErrorMsg('Please enter a valid YouTube URL or Video ID for Deck A.');
      return;
    }
    if (!idB) {
      setErrorMsg('Please enter a valid YouTube URL or Video ID for Deck B.');
      return;
    }

    onLoadCustomPair(
      {
        videoId: idA,
        title: customTitleA || `YouTube Track A (${idA})`,
        bpm: parseFloat(customBpmA) || 120,
      },
      {
        videoId: idB,
        title: customTitleB || `YouTube Track B (${idB})`,
        bpm: parseFloat(customBpmB) || 120,
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              YouTube DJ Mashup Library
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Curated DJ Pairings ({DEFAULT_MASHUP_PRESETS.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Load Any YouTube URL
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'presets' ? (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search artist, song, genre (e.g. Daft Punk, Funk, 80s)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Presets List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 flex flex-col justify-between gap-3 group transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                          {preset.genre}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono-numbers">
                          {preset.deckA.bpm} vs {preset.deckB.bpm} BPM
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </h3>

                      {/* Decks clash summary */}
                      <div className="mt-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-cyan-300">
                          <span className="text-[10px] font-bold bg-cyan-950 px-1 py-0.5 rounded border border-cyan-800">
                            DECK A
                          </span>
                          <span className="truncate">{preset.deckA.title} · {preset.deckA.artist}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <span className="text-[10px] font-bold bg-amber-950 px-1 py-0.5 rounded border border-amber-800">
                            DECK B
                          </span>
                          <span className="truncate">{preset.deckB.title} · {preset.deckB.artist}</span>
                        </div>
                      </div>

                      <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                        {preset.notes}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectPreset(preset);
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded bg-zinc-800 hover:bg-cyan-500 hover:text-black text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-black shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Load Mashup into Decks</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Custom URL Loader */
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Paste any YouTube video link (full URL, shorts, or 11-character video ID) to mashup in real-time.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deck A Form */}
                <div className="p-4 rounded-lg bg-zinc-950/80 border border-cyan-900/60 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>DECK A TRACK</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">YouTube URL or ID *</label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={customUrlA}
                      onChange={(e) => setCustomUrlA(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Track Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. My Favorite Track"
                      value={customTitleA}
                      onChange={(e) => setCustomTitleA(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Estimated BPM</label>
                    <input
                      type="number"
                      value={customBpmA}
                      onChange={(e) => setCustomBpmA(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200"
                    />
                  </div>
                </div>

                {/* Deck B Form */}
                <div className="p-4 rounded-lg bg-zinc-950/80 border border-amber-900/60 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>DECK B TRACK</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">YouTube URL or ID *</label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={customUrlB}
                      onChange={(e) => setCustomUrlB(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Track Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Acapella / Instrumental"
                      value={customTitleB}
                      onChange={(e) => setCustomTitleB(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Estimated BPM</label>
                    <input
                      type="number"
                      value={customBpmB}
                      onChange={(e) => setCustomBpmB(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
                >
                  Load Custom Mashup Pair
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
