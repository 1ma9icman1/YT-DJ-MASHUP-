import React, { useEffect, useRef } from 'react';
import { DeckState, VideoDisplayMode, VideoFilter } from '../types/dj';
import { formatTimecode } from '../utils/youtube';
import { Disc, Monitor, Tv, Eye, Layers } from 'lucide-react';

interface VideoMashupStageProps {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number; // -1.0 (A) to +1.0 (B)
  videoMode: VideoDisplayMode;
  videoFilter: VideoFilter;
  containerRefA: React.RefObject<HTMLDivElement | null>;
  containerRefB: React.RefObject<HTMLDivElement | null>;
  videoRefA: React.RefObject<HTMLVideoElement | null>;
  videoRefB: React.RefObject<HTMLVideoElement | null>;
  masterVolume: number;
}

export const VideoMashupStage: React.FC<VideoMashupStageProps> = ({
  deckA,
  deckB,
  crossfader,
  videoMode,
  videoFilter,
  containerRefA,
  containerRefB,
  videoRefA,
  videoRefB,
  masterVolume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render video source for Deck A (direct HTML5 stream or YouTube iframe container)
  const renderDeckAContent = () => {
    if (deckA.directStreamUrl) {
      return (
        <video
          ref={videoRefA}
          src={deckA.directStreamUrl}
          className="w-full h-full object-cover pointer-events-none"
          playsInline
          loop={deckA.isLooping}
        />
      );
    }
    return (
      <div
        ref={containerRefA}
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:pointer-events-none"
      />
    );
  };

  // Render video source for Deck B (direct HTML5 stream or YouTube iframe container)
  const renderDeckBContent = () => {
    if (deckB.directStreamUrl) {
      return (
        <video
          ref={videoRefB}
          src={deckB.directStreamUrl}
          className="w-full h-full object-cover pointer-events-none"
          playsInline
          loop={deckB.isLooping}
        />
      );
    }
    return (
      <div
        ref={containerRefB}
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:pointer-events-none"
      />
    );
  };

  // Audio spectrum visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.08;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const isPlayingA = deckA.isPlaying;
      const isPlayingB = deckB.isPlaying;
      const totalEnergy = ((isPlayingA ? deckA.volume : 0) + (isPlayingB ? deckB.volume : 0)) / 200;

      if (totalEnergy > 0.02) {
        const barCount = 48;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const norm = i / barCount;
          // Harmonic wave simulation
          const waveA = isPlayingA
            ? Math.sin(norm * 14 + phase) * Math.cos(norm * 6 - phase * 0.5)
            : 0;
          const waveB = isPlayingB
            ? Math.sin(norm * 18 - phase * 1.2) * Math.cos(norm * 8 + phase * 0.7)
            : 0;

          const combined = Math.abs((waveA * (1 - (crossfader + 1) / 2) + waveB * ((crossfader + 1) / 2))) * totalEnergy;
          const barHeight = Math.max(3, combined * height * 0.85);

          // Color gradient blend between cyan (A) and amber (B) based on crossfader
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          if (crossfader < 0) {
            grad.addColorStop(0, '#06b6d4');
            grad.addColorStop(1, '#38bdf8');
          } else {
            grad.addColorStop(0, '#f59e0b');
            grad.addColorStop(1, '#fbbf24');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [deckA.isPlaying, deckA.volume, deckB.isPlaying, deckB.volume, crossfader]);

  // Compute opacity for crossfader blend mode
  // crossfader: -1 is 100% A, 0 is 50% A / 50% B, +1 is 100% B
  const blendOpacityB = Math.max(0, Math.min(1, (crossfader + 1) / 2));
  const blendOpacityA = 1 - blendOpacityB * 0.3; // keep A visible as base

  // Determine filter CSS class
  const getFilterStyle = () => {
    switch (videoFilter) {
      case 'crt':
        return 'contrast-125 saturate-125';
      case 'neon':
        return 'hue-rotate-90 saturate-200 contrast-110';
      case 'noir':
        return 'grayscale contrast-150';
      case 'strobe':
        return deckA.isPlaying || deckB.isPlaying ? 'animate-pulse contrast-125' : '';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full aspect-video md:aspect-[21/9] max-h-[460px] bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
      {/* Visualizer and Video Layer Container */}
      <div className={`relative w-full h-full ${getFilterStyle()}`}>
        {/* CROSSFADER BLEND MODE */}
        {videoMode === 'crossfader' && (
          <div className="relative w-full h-full">
            {/* Deck A layer */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{ opacity: blendOpacityA }}
            >
              {renderDeckAContent()}
            </div>
            {/* Deck B layer on top */}
            <div
              className="absolute inset-0 w-full h-full transition-opacity duration-75 mix-blend-screen"
              style={{ opacity: blendOpacityB }}
            >
              {renderDeckBContent()}
            </div>
          </div>
        )}

        {/* SPLIT SCREEN MODE */}
        {videoMode === 'split' && (
          <div className="relative w-full h-full flex">
            <div className="relative w-1/2 h-full border-r border-zinc-800 overflow-hidden">
              {renderDeckAContent()}
              <div className="absolute top-2 left-2 text-[10px] font-bold text-cyan-400 bg-black/60 px-2 py-0.5 rounded">
                DECK A
              </div>
            </div>
            <div className="relative w-1/2 h-full overflow-hidden">
              {renderDeckBContent()}
              <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-400 bg-black/60 px-2 py-0.5 rounded">
                DECK B
              </div>
            </div>
          </div>
        )}

        {/* PICTURE IN PICTURE DECK A MAIN */}
        {videoMode === 'pip-a' && (
          <div className="relative w-full h-full">
            <div className="w-full h-full">
              {renderDeckAContent()}
            </div>
            <div className="absolute bottom-6 right-4 w-1/3 aspect-video rounded-md overflow-hidden border-2 border-amber-500 shadow-xl z-20">
              {renderDeckBContent()}
              <span className="absolute top-1 left-1 text-[9px] font-bold text-amber-400 bg-black/70 px-1 rounded">
                DECK B
              </span>
            </div>
          </div>
        )}

        {/* PICTURE IN PICTURE DECK B MAIN */}
        {videoMode === 'pip-b' && (
          <div className="relative w-full h-full">
            <div className="w-full h-full">
              {renderDeckBContent()}
            </div>
            <div className="absolute bottom-6 left-4 w-1/3 aspect-video rounded-md overflow-hidden border-2 border-cyan-500 shadow-xl z-20">
              {renderDeckAContent()}
              <span className="absolute top-1 left-1 text-[9px] font-bold text-cyan-400 bg-black/70 px-1 rounded">
                DECK A
              </span>
            </div>
          </div>
        )}

        {/* SOLO DECK A */}
        {videoMode === 'solo-a' && (
          <div className="relative w-full h-full">
            {renderDeckAContent()}
            {/* hidden player B still playing audio */}
            <div className="hidden">
              {renderDeckBContent()}
            </div>
          </div>
        )}

        {/* SOLO DECK B */}
        {videoMode === 'solo-b' && (
          <div className="relative w-full h-full">
            {renderDeckBContent()}
            {/* hidden player A still playing audio */}
            <div className="hidden">
              {renderDeckAContent()}
            </div>
          </div>
        )}

        {/* VINYL STAGE / VISUALIZER ONLY */}
        {videoMode === 'vinyl' && (
          <div className="relative w-full h-full bg-zinc-950 flex items-center justify-around px-8">
            {/* Hidden players running audio */}
            <div className="hidden">
              {renderDeckAContent()}
              {renderDeckBContent()}
            </div>

            {/* Turntable A Simulation */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-36 h-36 md:w-48 md:h-48 rounded-full vinyl-grooves relative flex items-center justify-center border-4 border-zinc-800 shadow-2xl transition-transform ${
                  deckA.isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '2.5s' }}
              >
                <div className="absolute inset-0 rounded-full vinyl-sheen" />
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-600 border-2 border-cyan-400 flex flex-col items-center justify-center p-1 text-center shadow-md">
                  <span className="text-[9px] font-bold text-white truncate max-w-[60px]">
                    {deckA.title || 'Deck A'}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 mt-0.5 border border-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-cyan-400">DECK A (VINYL)</span>
            </div>

            {/* Turntable B Simulation */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-36 h-36 md:w-48 md:h-48 rounded-full vinyl-grooves relative flex items-center justify-center border-4 border-zinc-800 shadow-2xl transition-transform ${
                  deckB.isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '2.5s' }}
              >
                <div className="absolute inset-0 rounded-full vinyl-sheen" />
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-600 border-2 border-amber-400 flex flex-col items-center justify-center p-1 text-center shadow-md">
                  <span className="text-[9px] font-bold text-white truncate max-w-[60px]">
                    {deckB.title || 'Deck B'}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 mt-0.5 border border-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-400">DECK B (VINYL)</span>
            </div>
          </div>
        )}

        {/* CRT Scanline Overlay FX */}
        {videoFilter === 'crt' && <div className="absolute inset-0 crt-scanlines pointer-events-none" />}

        {/* Top Video Stage Bar Info */}
        <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/80 via-black/30 to-transparent">
          {/* Deck A readout */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 drop-shadow truncate max-w-[140px] md:max-w-[240px]">
              {deckA.title || 'Deck A'}
            </span>
            <span className="text-xs font-mono-numbers text-cyan-200/80 bg-black/50 px-1.5 py-0.5 rounded">
              {formatTimecode(deckA.currentTime)}
            </span>
          </div>

          {/* Mode Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-zinc-700/60 text-[10px] text-zinc-300 uppercase tracking-widest font-mono-numbers">
            <span>STAGE: {videoMode.toUpperCase()}</span>
            {videoFilter !== 'none' && <span className="text-cyan-400">· {videoFilter.toUpperCase()} FX</span>}
          </div>

          {/* Deck B readout */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-numbers text-amber-200/80 bg-black/50 px-1.5 py-0.5 rounded">
              {formatTimecode(deckB.currentTime)}
            </span>
            <span className="text-xs font-bold text-amber-300 drop-shadow truncate max-w-[140px] md:max-w-[240px]">
              {deckB.title || 'Deck B'}
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Audio Spectrum Waveform Line at Bottom */}
        <canvas
          ref={canvasRef}
          width={640}
          height={40}
          className="absolute bottom-0 inset-x-0 w-full h-9 pointer-events-none opacity-80"
        />
      </div>
    </div>
  );
};
