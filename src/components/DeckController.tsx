import React, { useRef, useState, useEffect } from 'react';
import { DeckState, HotCue } from '../types/dj';
import { RotaryKnob } from './RotaryKnob';
import { formatTimecode, formatSecondsToMS } from '../utils/youtube';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Zap,
  Volume2,
  Headphones,
  Sliders,
  ChevronDown,
  Plus,
  Minus,
  Upload,
  Search,
  FolderOpen,
  Pencil,
  Check,
} from 'lucide-react';

interface DeckControllerProps {
  deck: DeckState;
  otherDeck: DeckState;
  onPlayPause: () => void;
  onCue: () => void;
  onSetCuePoint: () => void;
  onHotCue: (index: number) => void;
  onClearHotCue: (index: number) => void;
  onSetLoop: (beats: number) => void;
  onToggleLoop: () => void;
  onHalveLoop: () => void;
  onDoubleLoop: () => void;
  onPitchChange: (pitchPercent: number) => void;
  onBpmChange: (newBpm: number) => void;
  onSetBaseBpm?: (baseBpm: number) => void;
  onSync: () => void;
  onTapBpm: () => void;
  onNudge: (deltaSeconds: number) => void;
  onScrub: (deltaSeconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onHighEqChange: (val: number) => void;
  onMidEqChange: (val: number) => void;
  onLowEqChange: (val: number) => void;
  onFilterChange: (val: number) => void;
  onToggleHighKill: () => void;
  onToggleMidKill: () => void;
  onToggleLowKill: () => void;
  onToggleHeadphoneCue: () => void;
  isHeadphoneCue: boolean;
  onLoadCustomTrack: () => void;
  onSearchTrack: () => void;
  onPushLocalFile?: (file: File) => void;
  onSpinback: () => void;
}

export const DeckController: React.FC<DeckControllerProps> = ({
  deck,
  otherDeck,
  onPlayPause,
  onCue,
  onSetCuePoint,
  onHotCue,
  onClearHotCue,
  onSetLoop,
  onToggleLoop,
  onHalveLoop,
  onDoubleLoop,
  onPitchChange,
  onBpmChange,
  onSetBaseBpm,
  onSync,
  onTapBpm,
  onNudge,
  onScrub,
  onVolumeChange,
  onHighEqChange,
  onMidEqChange,
  onLowEqChange,
  onFilterChange,
  onToggleHighKill,
  onToggleMidKill,
  onToggleLowKill,
  onToggleHeadphoneCue,
  isHeadphoneCue,
  onLoadCustomTrack,
  onSearchTrack,
  onPushLocalFile,
  onSpinback,
}) => {
  const isDeckA = deck.id === 'A';
  const themeColor = isDeckA ? '#06b6d4' : '#f59e0b'; // cyan vs amber
  const themeBgGlow = isDeckA ? 'shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'shadow-[0_0_20px_rgba(245,158,11,0.15)]';
  const themeBorder = isDeckA ? 'border-cyan-500/30' : 'border-amber-500/30';
  const themeText = isDeckA ? 'text-cyan-400' : 'text-amber-400';
  const themeBtnActive = isDeckA ? 'bg-cyan-500 text-black' : 'bg-amber-500 text-black';

  // State for Hot Cue clear mode toggle
  const [deleteCueMode, setDeleteCueMode] = useState(false);

  // State for direct BPM adjust input
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [tempBpmInput, setTempBpmInput] = useState('');

  // Hidden file input for native local audio/video file selection
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPushLocalFile) {
      onPushLocalFile(file);
    }
    if (e.target) e.target.value = '';
  };

  // Platter scratch / jog interaction
  const platterRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const lastAngleRef = useRef<number>(0);
  const rotationAngleRef = useRef<number>(0);

  // Continuous rotation during normal playback
  useEffect(() => {
    let animId: number;
    const rotate = () => {
      if (deck.isPlaying && !isScratching) {
        // 33 1/3 RPM = ~200 deg/sec at 1.0 rate
        const step = (3.5 * deck.playbackRate);
        rotationAngleRef.current = (rotationAngleRef.current + step) % 360;
        if (platterRef.current) {
          platterRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;
        }
      }
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, [deck.isPlaying, deck.playbackRate, isScratching]);

  // Jog Wheel pointer drag for scratching/scrubbing
  const handlePlatterPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const rect = platterRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePlatterPointerMove = (e: React.PointerEvent) => {
    if (!isScratching) return;
    const rect = platterRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let delta = currentAngle - lastAngleRef.current;

    // Normalize wrap around -PI to PI
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    lastAngleRef.current = currentAngle;
    const degDelta = (delta * 180) / Math.PI;
    rotationAngleRef.current += degDelta;
    if (platterRef.current) {
      platterRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;
    }

    // Scrub track audio position based on jog rotation
    const scrubSeconds = (degDelta / 360) * 1.8;
    onScrub(scrubSeconds);
  };

  const handlePlatterPointerUp = (e: React.PointerEvent) => {
    if (isScratching) {
      setIsScratching(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const progressPercent = deck.duration > 0 ? (deck.currentTime / deck.duration) * 100 : 0;
  const timeRemaining = Math.max(0, deck.duration - deck.currentTime);

  return (
    <div
      className={`flex flex-col bg-zinc-900/90 rounded-xl border ${themeBorder} ${themeBgGlow} p-4 text-zinc-200 select-none backdrop-blur-md`}
    >
      {/* 1. TOP HEADER & TRACK INFO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs font-display font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                isDeckA ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              DECK {deck.id}
            </span>
            {/* Interactive Header BPM Badge */}
            <button
              onClick={() => {
                setTempBpmInput(deck.bpm.toFixed(1));
                setIsEditingBpm(true);
              }}
              className="text-[11px] font-mono-numbers text-zinc-300 hover:text-white bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 hover:border-zinc-600 flex items-center gap-1 transition-colors cursor-pointer group"
              title="Click to adjust track BPM"
            >
              <span className="font-bold">{deck.bpm.toFixed(1)} BPM</span>
              <Pencil className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
            {deck.directStreamUrl ? (
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{deck.isLocalFile ? 'LOCAL MEDIA' : 'ytDownloader STREAM'}</span>
              </span>
            ) : (
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                IFRAME ENGINE
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-white truncate" title={deck.title}>
            {deck.title || `Deck ${deck.id} Track`}
          </h3>
          <p className="text-xs text-zinc-400 truncate">
            {deck.artist || 'YouTube Audio'}
          </p>
        </div>

        {/* Track Actions: Search, Load URL & Push Local with clean, balanced spacing */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleLocalFileChange}
          />

          {/* Search track button */}
          <button
            onClick={onSearchTrack}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-sm ${
              isDeckA
                ? 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border-cyan-700 hover:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-700 hover:border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
            }`}
            title={`Search YouTube tracks & mashups for Deck ${deck.id}`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          {/* Load URL button */}
          <button
            onClick={onLoadCustomTrack}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-500 flex items-center gap-1.5 transition-all shadow-sm"
            title="Load custom YouTube URL or Video ID"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load</span>
          </button>

          {/* Push Local file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800/80 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-zinc-700 hover:border-emerald-600 flex items-center gap-1.5 transition-all shadow-sm"
            title={`Push local audio/video file directly into Deck ${deck.id}`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Local</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRESS / TIMELINE STRIP */}
      <div className="py-2.5 border-b border-zinc-800/80">
        <div className="flex items-center justify-between text-xs font-mono-numbers mb-1.5">
          <span className={`${themeText} font-bold text-sm`}>
            {formatTimecode(deck.currentTime)}
          </span>
          <span className="text-zinc-500">
            -{formatSecondsToMS(timeRemaining)} / {formatSecondsToMS(deck.duration)}
          </span>
        </div>

        {/* Clickable Progress track */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            if (deck.duration > 0) {
              onScrub(clickPos * deck.duration - deck.currentTime);
            }
          }}
          className="relative w-full h-3 bg-zinc-950 rounded cursor-pointer overflow-hidden border border-zinc-800"
        >
          <div
            className={`h-full transition-all duration-75 ${
              isDeckA ? 'bg-cyan-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />

          {/* Hot Cue tick indicators on timeline */}
          {deck.hotCues.map((cue, idx) => {
            if (!cue || deck.duration <= 0) return null;
            const cuePct = (cue.time / deck.duration) * 100;
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-1 bg-white shadow-sm pointer-events-none"
                style={{ left: `${cuePct}%` }}
                title={`Hot Cue ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* 3. MAIN HARDWARE DECK BODY (TURNTABLE + CHANNEL STRIP + CONTROLS) */}
      <div className="grid grid-cols-12 gap-3 py-3">
        {/* LEFT COLUMN: TURNTABLE JOG WHEEL & PITCH BEND (7 COLS) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col items-center justify-between gap-3">
          {/* Turntable Platter */}
          <div className="relative flex items-center justify-center p-2">
            {/* Outer Strobe Ring */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full strobe-ring p-1.5 flex items-center justify-center shadow-2xl border border-zinc-800">
              {/* Vinyl Platter */}
              <div
                ref={platterRef}
                onPointerDown={handlePlatterPointerDown}
                onPointerMove={handlePlatterPointerMove}
                onPointerUp={handlePlatterPointerUp}
                className="relative w-full h-full rounded-full vinyl-grooves cursor-grab active:cursor-grabbing touch-none flex items-center justify-center shadow-inner"
              >
                {/* Vinyl Sheen Overlay */}
                <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none" />

                {/* Outer pitch strobe dot */}
                <div
                  className="absolute top-2 w-2 h-2 rounded-full pointer-events-none"
                  style={{ backgroundColor: themeColor, boxShadow: `0 0 6px ${themeColor}` }}
                />

                {/* Center Record Label */}
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex flex-col items-center justify-center p-1 overflow-hidden shadow-lg ${
                    isDeckA ? 'border-cyan-400 bg-cyan-950' : 'border-amber-400 bg-amber-950'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider ${themeText}`}>
                    DECK {deck.id}
                  </span>
                  <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-600 mt-1 shadow-inner" />
                  <span className="text-[9px] font-mono-numbers text-zinc-300 mt-1">
                    {deck.bpm.toFixed(0)} BPM
                  </span>
                </div>
              </div>
            </div>

            {/* Scratching indicator badge */}
            {isScratching && (
              <div className="absolute top-4 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white border border-white/20 uppercase animate-pulse">
                Scratch
              </div>
            )}
          </div>

          {/* Jog Platter Controls (Nudge - / +, Spinback, Tap BPM) */}
          <div className="flex items-center justify-center gap-2 w-full">
            <button
              onClick={() => onNudge(-0.1)}
              className="px-2.5 py-1 text-xs font-mono-numbers rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 active:bg-zinc-600"
              title="Pitch Bend Nudge Backward (-0.1s)"
            >
              <Minus className="w-3 h-3" />
              <span>Nudge</span>
            </button>

            <button
              onClick={onSpinback}
              className="px-2.5 py-1 text-xs font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 active:bg-rose-950"
              title="Vinyl Spinback FX"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Spinback</span>
            </button>

            <button
              onClick={onTapBpm}
              className="px-2.5 py-1 text-xs font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 active:bg-cyan-900"
              title="Tap Tempo to detect BPM"
            >
              TAP BPM
            </button>

            <button
              onClick={() => onNudge(0.1)}
              className="px-2.5 py-1 text-xs font-mono-numbers rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 active:bg-zinc-600"
              title="Pitch Bend Nudge Forward (+0.1s)"
            >
              <span>Nudge</span>
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CHANNEL STRIP (EQ, FILTER, PITCH, VOLUME) (5 COLS) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 gap-3">
          {/* 3-BAND EQ & FILTER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2 gap-2 items-center justify-items-center">
            {/* HIGH EQ */}
            <div className="flex flex-col items-center">
              <RotaryKnob
                label="HIGH"
                value={deck.highKill ? -100 : deck.highEq}
                color={themeColor}
                size={40}
                onChange={onHighEqChange}
              />
              <button
                onClick={onToggleHighKill}
                className={`mt-1 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                  deck.highKill ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Kill High Frequencies"
              >
                Kill
              </button>
            </div>

            {/* MID EQ */}
            <div className="flex flex-col items-center">
              <RotaryKnob
                label="MID"
                value={deck.midKill ? -100 : deck.midEq}
                color={themeColor}
                size={40}
                onChange={onMidEqChange}
              />
              <button
                onClick={onToggleMidKill}
                className={`mt-1 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                  deck.midKill ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Kill Mid Frequencies"
              >
                Kill
              </button>
            </div>

            {/* LOW EQ */}
            <div className="flex flex-col items-center">
              <RotaryKnob
                label="LOW"
                value={deck.lowKill ? -100 : deck.lowEq}
                color={themeColor}
                size={40}
                onChange={onLowEqChange}
              />
              <button
                onClick={onToggleLowKill}
                className={`mt-1 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                  deck.lowKill ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Kill Low / Bass Frequencies"
              >
                Kill
              </button>
            </div>

            {/* FILTER KNOB */}
            <div className="flex flex-col items-center">
              <RotaryKnob
                label="FILTER"
                value={deck.filter}
                color="#a855f7"
                size={40}
                onChange={onFilterChange}
              />
              <button
                onClick={() => onFilterChange(0)}
                className="mt-1 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                title="Reset Filter"
              >
                Rst
              </button>
            </div>
          </div>

          {/* TEMPO & BPM ADJUST ENGINE */}
          <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-2.5">
            {/* 1. Header: Live BPM Display / Direct Input & Beat SYNC */}
            <div className="flex items-center justify-between text-xs font-mono-numbers">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                  TEMPO:
                </span>
                {isEditingBpm ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = parseFloat(tempBpmInput);
                      if (!isNaN(val) && val >= 30 && val <= 300) {
                        onBpmChange(val);
                      }
                      setIsEditingBpm(false);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      value={tempBpmInput}
                      onChange={(e) => setTempBpmInput(e.target.value)}
                      autoFocus
                      className="w-16 px-1.5 py-0.5 bg-zinc-950 border border-cyan-400 rounded text-xs text-white font-mono focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold rounded"
                      title="Apply BPM"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBpm(false)}
                      className="px-1 py-0.5 text-zinc-400 hover:text-white text-[10px]"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setTempBpmInput(deck.bpm.toFixed(1));
                      setIsEditingBpm(true);
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors group cursor-text"
                    title="Click to type exact BPM value"
                  >
                    <span className={`text-xs font-black font-mono-numbers ${themeText}`}>
                      {deck.bpm.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">BPM</span>
                    <Pencil className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300 ml-0.5" />
                  </button>
                )}
                {deck.pitchPercent !== 0 && (
                  <span className="text-[10px] font-mono text-zinc-500 truncate">
                    ({deck.pitchPercent > 0 ? `+${deck.pitchPercent.toFixed(1)}%` : `${deck.pitchPercent.toFixed(1)}%`})
                  </span>
                )}
              </div>

              {/* BEAT SYNC BUTTON */}
              <button
                onClick={onSync}
                className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider transition-all shrink-0 ${
                  Math.abs(deck.bpm - otherDeck.bpm) < 0.2
                    ? 'bg-emerald-500 text-black shadow-[0_0_8px_#10b981] font-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
                title={`Beat Sync: Match tempo to Deck ${otherDeck.id} (${otherDeck.bpm.toFixed(1)} BPM)`}
              >
                SYNC
              </button>
            </div>

            {/* 2. BPM Adjust Steppers & Rhythm Multipliers */}
            <div className="flex items-center justify-between gap-1 bg-zinc-950/70 px-1.5 py-1 rounded border border-zinc-800/80">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight shrink-0">
                ADJUST:
              </span>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                <button
                  onClick={() => onBpmChange(deck.bpm - 1.0)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 active:scale-95 transition-transform"
                  title="Step down 1.0 BPM"
                >
                  -1
                </button>
                <button
                  onClick={() => onBpmChange(deck.bpm - 0.1)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 active:scale-95 transition-transform"
                  title="Fine step down 0.1 BPM"
                >
                  -0.1
                </button>
                <button
                  onClick={() => onBpmChange(deck.bpm + 0.1)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 active:scale-95 transition-transform"
                  title="Fine step up 0.1 BPM"
                >
                  +0.1
                </button>
                <button
                  onClick={() => onBpmChange(deck.bpm + 1.0)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 active:scale-95 transition-transform"
                  title="Step up 1.0 BPM"
                >
                  +1
                </button>
                <button
                  onClick={() => onBpmChange(deck.bpm / 2)}
                  className="px-1 py-0.5 text-[10px] font-mono rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 active:scale-95"
                  title="Halve BPM (/2)"
                >
                  /2
                </button>
                <button
                  onClick={() => onBpmChange(deck.bpm * 2)}
                  className="px-1 py-0.5 text-[10px] font-mono rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 active:scale-95"
                  title="Double BPM (x2)"
                >
                  x2
                </button>
                <button
                  onClick={() => onBpmChange(deck.baseBpm || 120)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 active:scale-95"
                  title="Reset to native unpitched BPM"
                >
                  RST
                </button>
              </div>
            </div>

            {/* 3. Pitch Slider with Center Reset */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">-16%</span>
              <input
                type="range"
                min={-16}
                max={16}
                step={0.1}
                value={deck.pitchPercent}
                onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 font-mono">+16%</span>
              <button
                onClick={() => onPitchChange(0)}
                className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 border border-zinc-700 font-mono active:scale-95"
                title="Reset Pitch Fader to 0%"
              >
                0%
              </button>
            </div>
          </div>

          {/* CHANNEL LEVEL VOLUME & METER */}
          <div className="flex items-center gap-3 border-t border-zinc-800/80 pt-2">
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">LEVEL</span>
                <span className="font-mono-numbers text-zinc-300">{deck.volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={deck.volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Stereo LED VU Meter Simulation */}
            <div className="flex items-end gap-1 h-12 py-1 px-1.5 bg-zinc-950 rounded border border-zinc-800">
              {[0, 1].map((channel) => (
                <div key={channel} className="flex flex-col-reverse gap-0.5 w-1.5 h-full">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const threshold = (i / 8) * 100;
                    const isActive = deck.isPlaying && deck.volume > threshold;
                    const isPeak = i >= 6;
                    return (
                      <div
                        key={i}
                        className={`w-full flex-1 rounded-xs transition-colors duration-75 ${
                          isActive
                            ? isPeak
                              ? 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'
                              : 'bg-emerald-400 shadow-[0_0_2px_#34d399]'
                            : 'bg-zinc-800'
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Headphone Cue PFL toggle */}
            <button
              onClick={onToggleHeadphoneCue}
              className={`p-2 rounded-md border transition-colors ${
                isHeadphoneCue
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
              title="Headphone Cue (PFL)"
            >
              <Headphones className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. PERFORMANCE PADS & LOOP CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
        {/* HOT CUES (1 to 4) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">HOT CUES</span>
            <button
              onClick={() => setDeleteCueMode(!deleteCueMode)}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                deleteCueMode ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {deleteCueMode ? 'Clear Active' : 'Clear Mode'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((idx) => {
              const cue = deck.hotCues[idx];
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (deleteCueMode) {
                      onClearHotCue(idx);
                    } else {
                      onHotCue(idx);
                    }
                  }}
                  className={`py-2 px-1 rounded-md text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                    cue
                      ? deleteCueMode
                        ? 'bg-rose-950/80 text-rose-300 border-rose-600 hover:bg-rose-800'
                        : isDeckA
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 hover:bg-cyan-900 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'bg-amber-950 text-amber-300 border-amber-500 hover:bg-amber-900 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-800/60 text-zinc-500 border-zinc-700/60 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
                  title={cue ? `Jump to Cue ${idx + 1} (${formatTimecode(cue.time)})` : `Set Hot Cue ${idx + 1}`}
                >
                  <span>CUE {idx + 1}</span>
                  <span className="text-[9px] font-mono-numbers opacity-80">
                    {cue ? formatSecondsToMS(cue.time) : 'EMPTY'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LOOP CONTROLS */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">AUTO LOOP</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onHalveLoop}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                title="Halve Loop Length (1/2x)"
              >
                1/2x
              </button>
              <button
                onClick={onDoubleLoop}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                title="Double Loop Length (2x)"
              >
                2x
              </button>
              <button
                onClick={onToggleLoop}
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                  deck.isLooping
                    ? 'bg-emerald-500 text-black shadow-[0_0_8px_#10b981]'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {deck.isLooping ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 4, 8, 16].map((beats) => {
              const isCurrent = deck.isLooping && deck.loopLengthBeats === beats;
              return (
                <button
                  key={beats}
                  onClick={() => onSetLoop(beats)}
                  className={`py-2 rounded-md text-xs font-mono font-bold transition-all border ${
                    isCurrent
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_#10b981]'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  }`}
                  title={`Loop ${beats} Beats`}
                >
                  {beats}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. BIG TRANSPORT BUTTONS (PLAY / PAUSE & CUE) */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-zinc-800">
        {/* CUE BUTTON */}
        <button
          onClick={onCue}
          className="py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-amber-400 font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg"
          title={`Cue Point: ${formatTimecode(deck.cuePoint)} (Click to jump, right click or long press to set)`}
          onContextMenu={(e) => {
            e.preventDefault();
            onSetCuePoint();
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>CUE</span>
        </button>

        {/* PLAY / PAUSE BUTTON */}
        <button
          onClick={onPlayPause}
          className={`py-3 px-4 rounded-lg font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg ${
            deck.isPlaying
              ? isDeckA
                ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_16px_rgba(245,158,11,0.5)]'
              : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white'
          }`}
          title={deck.isPlaying ? 'Pause' : 'Play'}
        >
          {deck.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{deck.isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>
      </div>
    </div>
  );
};
