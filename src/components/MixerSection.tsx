import React, { useState } from 'react';
import { CrossfaderCurve, VideoDisplayMode, VideoFilter } from '../types/dj';
import {
  Sliders,
  Volume2,
  Tv,
  Eye,
  Sparkles,
  Zap,
  FastForward,
  Headphones,
} from 'lucide-react';

interface MixerSectionProps {
  crossfader: number; // -1.0 to +1.0
  onCrossfaderChange: (val: number) => void;
  crossfaderCurve: CrossfaderCurve;
  onCurveChange: (curve: CrossfaderCurve) => void;
  masterVolume: number; // 0 to 100
  onMasterVolumeChange: (vol: number) => void;
  videoMode: VideoDisplayMode;
  onVideoModeChange: (mode: VideoDisplayMode) => void;
  videoFilter: VideoFilter;
  onVideoFilterChange: (filter: VideoFilter) => void;
  onAutoFade: (target: 'A' | 'B' | 'CENTER', durationSec: number) => void;
  isAutoFading: boolean;
  cueDeckA: boolean;
  cueDeckB: boolean;
  onToggleCueA: () => void;
  onToggleCueB: () => void;
}

export const MixerSection: React.FC<MixerSectionProps> = ({
  crossfader,
  onCrossfaderChange,
  crossfaderCurve,
  onCurveChange,
  masterVolume,
  onMasterVolumeChange,
  videoMode,
  onVideoModeChange,
  videoFilter,
  onVideoFilterChange,
  onAutoFade,
  isAutoFading,
  cueDeckA,
  cueDeckB,
  onToggleCueA,
  onToggleCueB,
}) => {
  const [transitionTime, setTransitionTime] = useState<number>(4); // seconds

  return (
    <div className="flex flex-col bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 text-zinc-200 select-none backdrop-blur-md shadow-2xl gap-4">
      {/* 1. MIXER TOP: MASTER VOLUME & VIDEO DISPLAY MODES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-800 pb-3">
        {/* Master Output Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>MASTER OUTPUT</span>
            </span>
            <span className="font-mono-numbers text-zinc-400">{masterVolume}%</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            {/* Master Peak Level Meter */}
            <div className="flex gap-0.5 h-4 px-1 py-0.5 bg-zinc-950 rounded border border-zinc-800">
              {Array.from({ length: 10 }).map((_, i) => {
                const isLit = (masterVolume / 100) * 10 > i;
                const isRed = i >= 8;
                return (
                  <div
                    key={i}
                    className={`w-1 h-full rounded-xs ${
                      isLit
                        ? isRed
                          ? 'bg-rose-500 shadow-[0_0_2px_#f43f5e]'
                          : 'bg-emerald-400 shadow-[0_0_2px_#34d399]'
                        : 'bg-zinc-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Video Mashup Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>VIDEO MASHUP DISPLAY MODE</span>
          </span>

          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'crossfader', label: 'BLEND' },
              { id: 'split', label: 'SPLIT' },
              { id: 'pip-a', label: 'PIP A' },
              { id: 'pip-b', label: 'PIP B' },
              { id: 'solo-a', label: 'SOLO A' },
              { id: 'solo-b', label: 'SOLO B' },
              { id: 'vinyl', label: 'VINYL' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onVideoModeChange(mode.id as VideoDisplayMode)}
                className={`py-1 px-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-colors border ${
                  videoMode === mode.id
                    ? 'bg-zinc-100 text-black border-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. VIDEO FX & HEADPHONE CUE ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 text-xs">
        {/* Video FX Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 text-[11px] font-medium mr-1">VISUAL FX:</span>
          {(['none', 'crt', 'neon', 'noir', 'strobe'] as VideoFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => onVideoFilterChange(filter)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                videoFilter === filter
                  ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Headphone Cue Master Monitors */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1">
            <Headphones className="w-3 h-3 text-zinc-300" />
            <span>CUE MONITOR:</span>
          </span>
          <button
            onClick={onToggleCueA}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              cueDeckA ? 'bg-cyan-500 text-black shadow-[0_0_8px_#06b6d4]' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            DECK A
          </button>
          <button
            onClick={onToggleCueB}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              cueDeckB ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            DECK B
          </button>
        </div>
      </div>

      {/* 3. MASTER CROSSFADER SECTION */}
      <div className="flex flex-col gap-3 py-1">
        {/* Crossfader Curve & Auto-Fade Settings */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px]">CURVE:</span>
            {(['linear', 'cut', 'smooth'] as CrossfaderCurve[]).map((c) => (
              <button
                key={c}
                onClick={() => onCurveChange(c)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                  crossfaderCurve === c ? 'bg-zinc-200 text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Auto-Fade Transition Duration */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[11px]">AUTO-FADE:</span>
            {[2, 4, 8, 16].map((dur) => (
              <button
                key={dur}
                onClick={() => setTransitionTime(dur)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  transitionTime === dur ? 'bg-cyan-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        {/* Crossfader Graphic Slider Container */}
        <div className="relative px-2 py-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
          {/* Deck A and Deck B indicator tags */}
          <div className="flex justify-between items-center text-xs font-bold mb-1">
            <span className="text-cyan-400 flex items-center gap-1">
              <span>◄ DECK A</span>
              <span className="font-mono-numbers text-[10px] text-zinc-500">
                ({Math.round(((1 - crossfader) / 2) * 100)}%)
              </span>
            </span>

            <span className="text-[10px] font-mono-numbers text-zinc-500">
              CENTER (50/50)
            </span>

            <span className="text-amber-400 flex items-center gap-1">
              <span className="font-mono-numbers text-[10px] text-zinc-500">
                ({Math.round(((crossfader + 1) / 2) * 100)}%)
              </span>
              <span>DECK B ►</span>
            </span>
          </div>

          {/* Main Horizontal Crossfader Input */}
          <div className="relative py-3">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={crossfader}
              onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
              className="w-full crossfader-input"
            />
          </div>

          {/* Quick Cut & Auto-Fade Action Bar */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => onCrossfaderChange(-1)}
              className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold border border-zinc-700"
              title="Cut 100% to Deck A"
            >
              CUT A
            </button>

            <button
              onClick={() => onAutoFade('A', transitionTime)}
              disabled={isAutoFading}
              className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1"
              title={`Auto-fade to Deck A over ${transitionTime}s`}
            >
              <FastForward className="w-3 h-3 rotate-180" />
              <span>Fade A</span>
            </button>

            <button
              onClick={() => onCrossfaderChange(0)}
              className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700"
              title="Center Crossfader (50/50 Blend)"
            >
              50 / 50
            </button>

            <button
              onClick={() => onAutoFade('B', transitionTime)}
              disabled={isAutoFading}
              className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1"
              title={`Auto-fade to Deck B over ${transitionTime}s`}
            >
              <span>Fade B</span>
              <FastForward className="w-3 h-3" />
            </button>

            <button
              onClick={() => onCrossfaderChange(1)}
              className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold border border-zinc-700"
              title="Cut 100% to Deck B"
            >
              CUT B
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
