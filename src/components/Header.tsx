import React from 'react';
import { Disc3, Radio, Sparkles, BookOpen, Volume2 } from 'lucide-react';

interface HeaderProps {
  onOpenPresets: () => void;
  onOpenShortcuts: () => void;
  onOpenRecorder: () => void;
  onOpenDownloader: () => void;
  isRecording: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPresets,
  onOpenShortcuts,
  onOpenRecorder,
  onOpenDownloader,
  isRecording,
  activeSection,
  setActiveSection,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text wordmark in display face */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="text-lg font-display font-extrabold tracking-tight text-white flex items-center gap-2.5 hover:text-cyan-400 transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
        <span>DJ YouTube Mashup</span>
      </a>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <button
          onClick={() => {
            setActiveSection('decks');
            document.getElementById('decks-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`transition-colors hover:text-white ${
            activeSection === 'decks' ? 'text-cyan-400' : ''
          }`}
        >
          Decks & Stage
        </button>
        <button
          onClick={() => {
            setActiveSection('sampler');
            document.getElementById('sampler-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`transition-colors hover:text-white ${
            activeSection === 'sampler' ? 'text-cyan-400' : ''
          }`}
        >
          FX Sampler
        </button>
        <button
          onClick={onOpenDownloader}
          className="transition-colors hover:text-cyan-400 text-cyan-300 font-bold flex items-center gap-1"
        >
          <span>ytDownloader Grabber</span>
        </button>
        <button
          onClick={onOpenPresets}
          className="transition-colors hover:text-white"
        >
          Curated Mashups
        </button>
        <button
          onClick={onOpenRecorder}
          className="transition-colors hover:text-white"
        >
          Mix Session Log
        </button>
        <button
          onClick={onOpenShortcuts}
          className="transition-colors hover:text-white"
        >
          DJ Hotkeys
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDownloader}
          className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Extract direct stream or load local ytDownloader media file"
        >
          <span>Grab Streams</span>
        </button>

        <button
          onClick={onOpenPresets}
          className="px-4 py-1.5 text-xs font-medium text-black bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shadow-[0_0_12px_rgba(34,211,238,0.3)] flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Mashup</span>
        </button>
      </div>
    </header>
  );
};
