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
      {/* 1. MASTER OUTPUT SECTION */}
      <div className="flex flex-col gap-2 pb-3.5 border-b border-zinc-800">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-zinc-200 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>MASTER OUTPUT</span>
          </span>
          <span className="font-mono-numbers text-cyan-400 font-bold">{masterVolume}%</span>
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
          <div className="flex gap-0.5 h-4 px-1.5 py-0.5 bg-zinc-950 rounded border border-zinc-800 shrink-0">
            {Array.from({ length: 10 }).map((_, i) => {
              const isLit = (masterVolume / 100) * 10 > i;
              const isRed = i >= 8;
              return (
                <div
                  key={i}
                  className={`w-1.5 h-full rounded-xs transition-colors duration-75 ${
                    isLit
                      ? isRed
                        ? 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'
                        : 'bg-emerald-400 shadow-[0_0_2px_#34d399]'
                      : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. VIDEO MASHUP DISPLAY MODE */}
      <div className="flex flex-col gap-2 pb-3.5 border-b border-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-200 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>VIDEO DISPLAY MODE</span>
          </span>
          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900">
            {videoMode}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'crossfader', label: 'BLEND' },
            { id: 'split', label: 'SPLIT' },
            { id: 'pip-a', label: 'PIP A' },
            { id: 'pip-b', label: 'PIP B' },
            { id: 'solo-a', label: 'SOLO A' },
            { id: 'solo-b', label: 'SOLO B' },
            { id: 'vinyl', label: 'VINYL' },
            { id: 'milkdrop', label: 'MILKDROP' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onVideoModeChange(mode.id as VideoDisplayMode)}
              className={`py-2 px-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border whitespace-nowrap flex items-center justify-center ${
                videoMode === mode.id
                  ? mode.id === 'milkdrop'
                    ? 'bg-purple-500 text-white border-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.8)] font-black'
                    : 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)] font-black'
                  : mode.id === 'milkdrop'
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800/80 hover:border-purple-600'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. VISUAL FX FILTERS */}
      <div className="flex flex-col gap-2 pb-3.5 border-b border-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>VISUAL FX FILTERS</span>
          </span>
          <span className="text-[10px] font-mono uppercase text-purple-400 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-900">
            {videoFilter}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {(['none', 'crt', 'neon', 'noir', 'strobe'] as VideoFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => onVideoFilterChange(filter)}
              className={`py-1.5 px-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all border text-center flex items-center justify-center ${
                videoFilter === filter
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] font-black'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border-zinc-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 4. HEADPHONE CUE MONITOR */}
      <div className="flex flex-col gap-2 pb-3.5 border-b border-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-200 flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-zinc-400" />
            <span>HEADPHONE CUE MONITOR</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {cueDeckA && cueDeckB ? 'BOTH CUES ON' : cueDeckA ? 'DECK A ACTIVE' : cueDeckB ? 'DECK B ACTIVE' : 'ALL OFF'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggleCueA}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
              cueDeckA
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_#06b6d4] font-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border-zinc-700 hover:border-cyan-800'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${cueDeckA ? 'bg-black' : 'bg-cyan-500'}`} />
            <span>CUE DECK A</span>
          </button>
          <button
            onClick={onToggleCueB}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
              cueDeckB
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_#f59e0b] font-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-zinc-700 hover:border-amber-800'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${cueDeckB ? 'bg-black' : 'bg-amber-500'}`} />
            <span>CUE DECK B</span>
          </button>
        </div>
      </div>

      {/* 5. MASTER CROSSFADER SECTION */}
      <div className="flex flex-col gap-3 pt-1">
        {/* Curve & Fade settings in two clean balanced panels */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Curve Selector */}
          <div className="flex flex-col gap-1.5 p-2 bg-zinc-950/60 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-zinc-400 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>CURVE</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{crossfaderCurve}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['linear', 'cut', 'smooth'] as CrossfaderCurve[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onCurveChange(c)}
                  className={`py-1.5 px-1 rounded text-[10px] font-mono uppercase font-bold text-center transition-all ${
                    crossfaderCurve === c
                      ? 'bg-white text-black shadow-sm font-black'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Fade Duration */}
          <div className="flex flex-col gap-1.5 p-2 bg-zinc-950/60 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-zinc-400 flex items-center gap-1">
                <FastForward className="w-3 h-3 text-amber-400" />
                <span>AUTO-FADE</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{transitionTime}s</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[2, 4, 8, 16].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setTransitionTime(dur)}
                  className={`py-1.5 px-1 rounded text-[10px] font-mono font-bold text-center transition-all ${
                    transitionTime === dur
                      ? 'bg-cyan-500 text-black shadow-sm font-black'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Crossfader Graphic Slider Container */}
        <div className="flex flex-col gap-3 p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800 shadow-inner">
          {/* Deck A and Deck B indicator tags */}
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <span>◄ DECK A</span>
              <span className="font-mono-numbers text-[11px] text-cyan-300/80 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                {Math.round(((1 - crossfader) / 2) * 100)}%
              </span>
            </span>

            <span className="text-[11px] font-mono-numbers text-zinc-400 font-semibold px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">
              {Math.abs(crossfader) <= 0.03 ? 'CENTER (50/50)' : crossfader < 0 ? `DECK A +${Math.round(-crossfader * 50)}%` : `DECK B +${Math.round(crossfader * 50)}%`}
            </span>

            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="font-mono-numbers text-[11px] text-amber-300/80 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                {Math.round(((crossfader + 1) / 2) * 100)}%
              </span>
              <span>DECK B ►</span>
            </span>
          </div>

          {/* Main Horizontal Crossfader Input */}
          <div className="relative py-2 px-1">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={crossfader}
              onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
              className="w-full crossfader-input h-4 cursor-ew-resize"
            />
          </div>

          {/* Primary Crossfader Center & Quick Cut Buttons */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => onCrossfaderChange(-1)}
              className={`py-2.5 px-3 rounded-lg text-xs font-black tracking-wider transition-all border flex items-center justify-center gap-1.5 active:scale-95 ${
                crossfader <= -0.98
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)] font-black'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-cyan-400 border-zinc-700 hover:border-cyan-700'
              }`}
              title="Cut 100% to Deck A"
            >
              <span>CUT A</span>
            </button>

            <button
              onClick={() => onCrossfaderChange(0)}
              className={`py-2.5 px-3 rounded-lg text-xs font-black tracking-wider transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                Math.abs(crossfader) <= 0.03
                  ? 'bg-white text-black border-white shadow-[0_0_14px_rgba(255,255,255,0.7)] font-black ring-2 ring-white/50'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border-zinc-700 hover:border-zinc-500'
              }`}
              title="Center Crossfader (50/50 Blend)"
            >
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.abs(crossfader) <= 0.03 ? 'bg-cyan-500 ring-2 ring-cyan-300' : 'bg-zinc-500'
                }`}
              />
              <span>CENTER</span>
            </button>

            <button
              onClick={() => onCrossfaderChange(1)}
              className={`py-2.5 px-3 rounded-lg text-xs font-black tracking-wider transition-all border flex items-center justify-center gap-1.5 active:scale-95 ${
                crossfader >= 0.98
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-black'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-amber-400 border-zinc-700 hover:border-amber-700'
              }`}
              title="Cut 100% to Deck B"
            >
              <span>CUT B</span>
            </button>
          </div>

          {/* Auto-Fade Transition Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onAutoFade('A', transitionTime)}
              disabled={isAutoFading}
              className="py-2 px-3 rounded-lg bg-zinc-800/90 hover:bg-cyan-950 text-cyan-300 text-xs font-bold border border-zinc-700 hover:border-cyan-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
              title={`Smooth auto-fade to Deck A over ${transitionTime}s`}
            >
              <FastForward className="w-3.5 h-3.5 rotate-180" />
              <span>Fade to A ({transitionTime}s)</span>
            </button>

            <button
              onClick={() => onAutoFade('B', transitionTime)}
              disabled={isAutoFading}
              className="py-2 px-3 rounded-lg bg-zinc-800/90 hover:bg-amber-950 text-amber-300 text-xs font-bold border border-zinc-700 hover:border-amber-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
              title={`Smooth auto-fade to Deck B over ${transitionTime}s`}
            >
              <span>Fade to B ({transitionTime}s)</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
