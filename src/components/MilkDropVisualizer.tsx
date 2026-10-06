import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DeckState } from '../types/dj';
import { djAudio } from '../utils/audioFX';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Clock,
  Sliders,
  Volume2,
  Eye,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';

interface MilkDropVisualizerProps {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;
  masterVolume: number;
  onClose?: () => void;
  isFullscreenMode?: boolean;
}

export const MilkDropVisualizer: React.FC<MilkDropVisualizerProps> = ({
  deckA,
  deckB,
  crossfader,
  masterVolume,
  onClose,
  isFullscreenMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null);
  const presetsRef = useRef<Record<string, any>>({});
  const presetNamesRef = useRef<string[]>([]);
  const currentPresetIndexRef = useRef<number>(0);
  const [currentPresetName, setCurrentPresetName] = useState<string>('Loading Presets...');
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(true);
  const [cycleIntervalSec, setCycleIntervalSec] = useState<number>(15);
  const [blendTime, setBlendTime] = useState<number>(2.7);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isFullscreenMode);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [useFallbackEngine, setUseFallbackEngine] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [presetSearch, setPresetSearch] = useState<string>('');
  const [isPresetListOpen, setIsPresetListOpen] = useState<boolean>(false);

  // Audio beat synthesis oscillator node for driving visualizer from YouTube deck playback
  const beatOscRef = useRef<OscillatorNode | null>(null);
  const beatGainRef = useRef<GainNode | null>(null);

  // Initialize Butterchurn & Load Presets
  useEffect(() => {
    let isCancelled = false;
    let animId: number;

    const initEngine = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // Dynamic import butterchurn & butterchurn-presets
        const butterchurnModule = await import('butterchurn');
        const presetsModule = await import('butterchurn-presets');

        const butterchurn = (butterchurnModule as any).default || butterchurnModule;
        const butterchurnPresets = (presetsModule as any).default || presetsModule;

        if (isCancelled || !canvas) return;

        const allPresets = butterchurnPresets.getPresets();
        presetsRef.current = allPresets;
        const names = Object.keys(allPresets);
        presetNamesRef.current = names;

        if (names.length === 0) {
          throw new Error('No MilkDrop presets found');
        }

        const audioCtx = djAudio.getContext() || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }

        // Setup rhythmic audio feed
        const audioNode = djAudio.getVisualizerAudioNode();

        // Create visualizer instance
        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 500;
        canvas.width = width;
        canvas.height = height;

        const visualizer = butterchurn.createVisualizer(audioCtx, canvas, {
          width,
          height,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
          textureRatio: 1,
        });

        if (audioNode) {
          visualizer.connectAudio(audioNode);
        }

        // Setup synthetic beat pulse node to feed rhythmic bass energy when YouTube decks play
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(180, audioCtx.currentTime);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(60, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.01, audioCtx.currentTime);

          osc.connect(filter);
          filter.connect(gain);
          visualizer.connectAudio(gain);
          osc.start();

          beatOscRef.current = osc;
          beatGainRef.current = gain;
        } catch {}

        visualizerRef.current = visualizer;

        // Choose initial preset (prefer iconic Geiss or Royal preset if present)
        const initialIndex = Math.max(
          0,
          names.findIndex((n) => n.toLowerCase().includes('geiss') || n.toLowerCase().includes('mashup'))
        );
        currentPresetIndexRef.current = initialIndex >= 0 ? initialIndex : 0;
        const initialName = names[currentPresetIndexRef.current];
        visualizer.loadPreset(allPresets[initialName], 0.5);
        setCurrentPresetName(initialName);

        // Display current track titles in MilkDrop style
        const nowPlaying = [deckA.isPlaying && deckA.title, deckB.isPlaying && deckB.title].filter(Boolean).join(' vs ');
        if (nowPlaying && typeof visualizer.launchSongTitleAnim === 'function') {
          visualizer.launchSongTitleAnim(nowPlaying);
        }

        // Render loop
        let lastTime = performance.now();
        let frameCount = 0;

        const render = (time: number) => {
          if (isCancelled) return;

          // FPS counter
          frameCount++;
          if (time - lastTime >= 1000) {
            setFps(Math.round((frameCount * 1000) / (time - lastTime)));
            frameCount = 0;
            lastTime = time;
          }

          // Pulse audio gain based on active deck playback & crossfader
          if (beatGainRef.current && audioCtx) {
            const isPlayingA = deckA.isPlaying;
            const isPlayingB = deckB.isPlaying;
            const volA = isPlayingA ? deckA.volume / 100 : 0;
            const volB = isPlayingB ? deckB.volume / 100 : 0;
            const energy = (volA * (1 - (crossfader + 1) / 2) + volB * ((crossfader + 1) / 2)) * (masterVolume / 100);

            // Modulate frequency with BPM
            const currentBpm = crossfader < 0 ? deckA.bpm : deckB.bpm;
            const beatFreq = (currentBpm / 60) * 1.5;
            const pulse = (Math.sin((time / 1000) * beatFreq * Math.PI * 2) + 1) * 0.5;

            const targetGain = energy > 0 ? 0.05 + pulse * energy * 0.35 : 0.01;
            beatGainRef.current.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
          }

          if (visualizerRef.current) {
            visualizerRef.current.render();
          }

          animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
      } catch (err) {
        console.warn('Butterchurn WebGL MilkDrop initialization failed, switching to Canvas fallback:', err);
        setUseFallbackEngine(true);
      }
    };

    initEngine();

    return () => {
      isCancelled = true;
      if (animId) cancelAnimationFrame(animId);
      if (beatOscRef.current) {
        try {
          beatOscRef.current.stop();
          beatOscRef.current.disconnect();
        } catch {}
      }
    };
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;

      if (visualizerRef.current) {
        visualizerRef.current.setRendererSize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load Preset by Index
  const loadPresetByIndex = useCallback(
    (index: number) => {
      const names = presetNamesRef.current;
      const presets = presetsRef.current;
      if (names.length === 0 || !visualizerRef.current) return;

      const safeIndex = ((index % names.length) + names.length) % names.length;
      currentPresetIndexRef.current = safeIndex;
      const presetName = names[safeIndex];
      const presetObj = presets[presetName];

      visualizerRef.current.loadPreset(presetObj, blendTime);
      setCurrentPresetName(presetName);
    },
    [blendTime]
  );

  // Next Preset
  const handleNextPreset = useCallback(() => {
    loadPresetByIndex(currentPresetIndexRef.current + 1);
  }, [loadPresetByIndex]);

  // Prev Preset
  const handlePrevPreset = useCallback(() => {
    loadPresetByIndex(currentPresetIndexRef.current - 1);
  }, [loadPresetByIndex]);

  // Random Preset
  const handleRandomPreset = useCallback(() => {
    const names = presetNamesRef.current;
    if (names.length === 0) return;
    const randomIndex = Math.floor(Math.random() * names.length);
    loadPresetByIndex(randomIndex);
  }, [loadPresetByIndex]);

  // Auto-Cycle Timer
  useEffect(() => {
    if (!isAutoCycle) return;
    const interval = setInterval(() => {
      handleNextPreset();
    }, cycleIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [isAutoCycle, cycleIntervalSec, handleNextPreset]);

  // Keyboard Shortcuts for MilkDrop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        handleNextPreset();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrevPreset();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRandomPreset();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowControls((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPreset, handlePrevPreset, handleRandomPreset]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Fallback Psychedelic Canvas Engine (if Butterchurn WebGL fails to load)
  useEffect(() => {
    if (!useFallbackEngine) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderFallback = () => {
      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark feedback fade
      ctx.fillStyle = 'rgba(5, 5, 10, 0.12)';
      ctx.fillRect(0, 0, w, h);

      const isPlayingA = deckA.isPlaying;
      const isPlayingB = deckB.isPlaying;
      const energy = (isPlayingA ? deckA.volume : 0) + (isPlayingB ? deckB.volume : 0);

      // Radial kaleidoscopic MilkDrop tunnel
      const spokes = 16;
      for (let s = 0; s < spokes; s++) {
        const angle = (s / spokes) * Math.PI * 2 + t * 0.3;
        const radius = Math.min(w, h) * 0.42 * (1 + Math.sin(t * 3 + s) * 0.2);

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const hue = (t * 40 + s * (360 / spokes)) % 360;
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${Math.min(1, 0.4 + (energy / 200) * 0.6)})`;
        ctx.lineWidth = 2 + Math.sin(t * 4 + s) * 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(
          cx + Math.cos(angle + 0.5) * (radius * 0.5),
          cy + Math.sin(angle + 0.5) * (radius * 0.5),
          x + Math.sin(t * 2) * 40,
          y + Math.cos(t * 2) * 40,
          x,
          y
        );
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderFallback);
    };

    renderFallback();
    return () => cancelAnimationFrame(animId);
  }, [useFallbackEngine, deckA.isPlaying, deckA.volume, deckB.isPlaying, deckB.volume]);

  // Filtered presets for dropdown search
  const filteredPresets = presetNamesRef.current.filter((name) =>
    name.toLowerCase().includes(presetSearch.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden select-none flex flex-col justify-between group ${
        isFullscreen ? 'fixed inset-0 z-50' : 'min-h-[380px] h-full rounded-xl'
      }`}
    >
      {/* Visualizer Canvas Element */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover block cursor-pointer" />

      {/* Top Overlay Badge & HUD Header */}
      <div
        className={`relative z-10 flex items-center justify-between p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
      >
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
          <span className="font-display font-black text-xs tracking-wider uppercase text-white flex items-center gap-1.5">
            <span>MILKDROP 2</span>
            <span className="text-[10px] font-mono font-normal text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800">
              WEBGL
            </span>
          </span>
          <span className="text-[10px] font-mono text-zinc-400 border-l border-zinc-700 pl-2">
            {fps} FPS
          </span>
        </div>

        {/* Action Controls (Fullscreen & Close) */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/75 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors shadow-lg"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen Club Visualizer (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-black/75 hover:bg-rose-950 text-zinc-300 hover:text-rose-200 border border-zinc-800 hover:border-rose-800 transition-colors shadow-lg"
              title="Close MilkDrop (Return to Video Mashup)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center Track Title Flash Overlay */}
      {(deckA.isPlaying || deckB.isPlaying) && (
        <div className="relative z-10 pointer-events-none self-center text-center px-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-cyan-300/80 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
            {deckA.isPlaying && `DECK A: ${deckA.title}`}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-amber-300/80 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
            {deckB.isPlaying && `DECK B: ${deckB.title}`}
          </p>
        </div>
      )}

      {/* Bottom Floating Preset Navigator HUD */}
      <div
        className={`relative z-10 p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
      >
        <div className="max-w-3xl mx-auto bg-zinc-950/90 backdrop-blur-md rounded-xl border border-zinc-800 p-3 shadow-2xl flex flex-col gap-2.5">
          {/* Preset Title Bar & Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Prev Button */}
            <button
              onClick={handlePrevPreset}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1 text-xs font-bold transition-colors active:scale-95"
              title="Previous Preset (P)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREV</span>
            </button>

            {/* Current Preset Name & Dropdown Trigger */}
            <div className="flex-1 min-w-0 text-center relative">
              <button
                onClick={() => setIsPresetListOpen(!isPresetListOpen)}
                className="w-full text-xs font-mono font-bold text-white hover:text-purple-300 truncate px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 transition-colors"
                title="Click to view all 100 MilkDrop presets"
              >
                {currentPresetName}
              </button>

              {/* Preset Selection Dropdown Drawer */}
              {isPresetListOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-2 z-50 text-left">
                  <div className="p-1 mb-1 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Select MilkDrop Preset ({presetNamesRef.current.length})
                    </span>
                    <button
                      onClick={() => setIsPresetListOpen(false)}
                      className="text-zinc-500 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search preset name..."
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full px-2 py-1 mb-2 bg-zinc-950 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <div className="space-y-0.5">
                    {filteredPresets.slice(0, 40).map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          const idx = presetNamesRef.current.indexOf(name);
                          if (idx >= 0) loadPresetByIndex(idx);
                          setIsPresetListOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono truncate transition-colors ${
                          currentPresetName === name
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Random Shuffle Button */}
            <button
              onClick={handleRandomPreset}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-purple-200 border border-zinc-700 flex items-center gap-1 text-xs font-bold transition-colors active:scale-95"
              title="Shuffle Random Preset (R)"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>RANDOM</span>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNextPreset}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1 text-xs font-bold transition-colors active:scale-95"
              title="Next Preset (N)"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-bar: Auto-Cycle & Transition Speed */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-zinc-800 pt-2 text-zinc-400">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isAutoCycle}
                  onChange={(e) => setIsAutoCycle(e.target.checked)}
                  className="accent-purple-500 rounded"
                />
                <span className={isAutoCycle ? 'text-purple-300 font-bold' : 'text-zinc-400'}>
                  Auto-Cycle
                </span>
              </label>

              {isAutoCycle && (
                <div className="flex items-center gap-1">
                  {[10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setCycleIntervalSec(sec)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        cycleIntervalSec === sec
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">
                SHORTCUTS: [N]ext · [P]rev · [R]andom · [F]ullscreen · [H]ide HUD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
