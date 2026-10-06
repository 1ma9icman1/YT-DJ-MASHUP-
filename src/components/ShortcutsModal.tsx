import React from 'react';
import { X, Keyboard, Zap } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Deck A', category: 'Deck A' },
    { key: 'Shift + Space', desc: 'Play / Pause Deck B', category: 'Deck B' },
    { key: 'Q', desc: 'Cue Deck A', category: 'Deck A' },
    { key: 'P', desc: 'Cue Deck B', category: 'Deck B' },
    { key: '1, 2, 3, 4', desc: 'Trigger Hot Cues 1-4 on Deck A', category: 'Deck A' },
    { key: '7, 8, 9, 0', desc: 'Trigger Hot Cues 1-4 on Deck B', category: 'Deck B' },
    { key: '[', desc: 'Nudge Crossfader Left toward Deck A', category: 'Mixer' },
    { key: ']', desc: 'Nudge Crossfader Right toward Deck B', category: 'Mixer' },
    { key: '\\', desc: 'Center Crossfader (50/50 Blend)', category: 'Mixer' },
    { key: 'Shift + [', desc: 'Fast Cut 100% to Deck A', category: 'Mixer' },
    { key: 'Shift + ]', desc: 'Fast Cut 100% to Deck B', category: 'Mixer' },
    { key: 'A', desc: 'Beat Sync Deck A to Deck B', category: 'Sync' },
    { key: 'B', desc: 'Beat Sync Deck B to Deck A', category: 'Sync' },
    { key: 'L', desc: 'Toggle Loop on Deck A', category: 'Loops' },
    { key: 'Shift + L', desc: 'Toggle Loop on Deck B', category: 'Loops' },
    { key: '1 – 8 (Pads)', desc: 'Trigger SFX (Airhorn, Scratch, 808, Siren, etc.)', category: 'Sampler' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              DJ Controller Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-800/80">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 text-xs">
              <span className="text-zinc-300">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-zinc-950 border border-zinc-700 text-cyan-300 font-mono text-[11px] font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 text-center text-xs text-zinc-500">
          Tip: You can also use mouse / touch drag on the turntable platters to scratch and scrub audio in real time!
        </div>
      </div>
    </div>
  );
};
