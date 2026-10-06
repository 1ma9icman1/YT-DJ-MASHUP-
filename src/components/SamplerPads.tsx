import React, { useState } from 'react';
import { djAudio } from '../utils/audioFX';
import { Volume2, Sparkles, Disc, Radio } from 'lucide-react';

interface SamplerPadsProps {
  onLogEvent?: (desc: string) => void;
}

interface PadDef {
  id: string;
  key: string;
  name: string;
  color: string;
  action: () => void;
}

export const SamplerPads: React.FC<SamplerPadsProps> = ({ onLogEvent }) => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [samplerVolume, setSamplerVolume] = useState<number>(85);

  const triggerPad = (pad: PadDef) => {
    setActivePad(pad.id);
    pad.action();
    if (onLogEvent) {
      onLogEvent(`Triggered SFX Pad: ${pad.name}`);
    }
    setTimeout(() => {
      setActivePad((curr) => (curr === pad.id ? null : curr));
    }, 180);
  };

  const handleVolumeChange = (vol: number) => {
    setSamplerVolume(vol);
    djAudio.setVolume(vol / 100);
  };

  const pads: PadDef[] = [
    {
      id: 'airhorn',
      key: '1',
      name: 'AIR HORN',
      color: 'from-amber-500 to-red-600',
      action: () => djAudio.playAirhorn(),
    },
    {
      id: 'scratch',
      key: '2',
      name: 'SCRATCH',
      color: 'from-cyan-500 to-blue-600',
      action: () => djAudio.playScratch(),
    },
    {
      id: 'laser',
      key: '3',
      name: 'LASER',
      color: 'from-fuchsia-500 to-pink-600',
      action: () => djAudio.playLaser(),
    },
    {
      id: 'rewind',
      key: '4',
      name: 'SPINBACK',
      color: 'from-emerald-500 to-teal-600',
      action: () => djAudio.playRewind(),
    },
    {
      id: 'sub808',
      key: '5',
      name: '808 SUB DROP',
      color: 'from-purple-500 to-indigo-700',
      action: () => djAudio.play808Drop(),
    },
    {
      id: 'siren',
      key: '6',
      name: 'RAVE SIREN',
      color: 'from-rose-500 to-orange-600',
      action: () => djAudio.playSiren(),
    },
    {
      id: 'crowd',
      key: '7',
      name: 'CROWD CHEER',
      color: 'from-yellow-400 to-amber-600',
      action: () => djAudio.playCrowd(),
    },
    {
      id: 'impact',
      key: '8',
      name: 'BEAT IMPACT',
      color: 'from-sky-400 to-indigo-600',
      action: () => djAudio.playImpact(),
    },
  ];

  return (
    <div id="sampler-section" className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 select-none backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#e879f9]" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            DJ PERFORMANCE SAMPLER PADS
          </h3>
          <span className="hidden sm:inline text-xs text-zinc-500 font-mono-numbers">
            (HOTKEYS 1 – 8)
          </span>
        </div>

        {/* Sampler Volume Slider */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="range"
            min={0}
            max={100}
            value={samplerVolume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-24 accent-fuchsia-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            title="Sampler Volume"
          />
          <span className="text-[11px] font-mono-numbers text-zinc-400 w-8 text-right">
            {samplerVolume}%
          </span>
        </div>
      </div>

      {/* 8 Drum/FX Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
        {pads.map((pad) => {
          const isFired = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => triggerPad(pad)}
              className={`relative py-4 px-2 rounded-lg font-bold text-xs uppercase flex flex-col items-center justify-center gap-1.5 transition-all duration-75 border ${
                isFired
                  ? `bg-gradient-to-b ${pad.color} text-white border-white scale-95 shadow-[0_0_16px_rgba(255,255,255,0.6)]`
                  : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700 shadow-md'
              }`}
            >
              {/* Keyboard shortcut badge */}
              <span className="absolute top-1 right-1.5 text-[9px] font-mono-numbers text-zinc-500 bg-zinc-900/90 px-1 rounded">
                [{pad.key}]
              </span>

              <span className="text-[11px] font-extrabold tracking-wide text-center leading-tight">
                {pad.name}
              </span>

              {/* Status LED */}
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  isFired ? 'bg-white shadow-[0_0_6px_#ffffff]' : 'bg-zinc-700'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
