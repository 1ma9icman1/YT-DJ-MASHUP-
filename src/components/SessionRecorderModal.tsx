import React from 'react';
import { MixEvent } from '../types/dj';
import { formatSecondsToMS } from '../utils/youtube';
import { X, Copy, Check, Radio, Trash2 } from 'lucide-react';

interface SessionRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  events: MixEvent[];
  sessionDuration: number;
  onClearEvents: () => void;
}

export const SessionRecorderModal: React.FC<SessionRecorderModalProps> = ({
  isOpen,
  onClose,
  isRecording,
  onToggleRecording,
  events,
  sessionDuration,
  onClearEvents,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const exportText = events
    .map((e) => `[${formatSecondsToMS(e.timeInSec)}] (${e.deck}) ${e.description}`)
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `--- DJ YOUTUBE MASHUP SETLIST ---\nDuration: ${formatSecondsToMS(sessionDuration)}\n\n${exportText}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-5 h-5 ${
                isRecording ? 'text-rose-500 animate-pulse' : 'text-zinc-400'
              }`}
            />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              DJ Session Logger & Tracklist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-950/40 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleRecording}
              className={`px-3 py-1.5 rounded font-bold uppercase text-xs flex items-center gap-1.5 transition-colors ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.5)] animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-rose-500'}`} />
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>

            <span className="font-mono-numbers text-zinc-400">
              Elapsed: {formatSecondsToMS(sessionDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <>
                <button
                  onClick={onClearEvents}
                  className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                  title="Clear Log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Setlist'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {events.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-sans">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No mix events recorded yet.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Hit "Start Recording" to log transitions, loop drops, and hot cues in real time!
              </p>
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-zinc-800/40 border border-transparent hover:border-zinc-800"
              >
                <span className="text-zinc-500 shrink-0">
                  [{formatSecondsToMS(evt.timeInSec)}]
                </span>
                <span
                  className={`font-bold px-1 rounded text-[10px] shrink-0 ${
                    evt.deck === 'A'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : evt.deck === 'B'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-purple-950 text-purple-400 border border-purple-800'
                  }`}
                >
                  {evt.deck}
                </span>
                <span className="text-zinc-300 break-words">{evt.description}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
