export interface HotCue {
  id: number;
  time: number;
  label: string;
}

export interface MediaFormat {
  quality: string;
  container: string;
  type: string;
  url: string;
  proxyUrl: string;
  size?: string;
  fps?: number;
  bitrate?: number;
}

export type PlaybackEngine = 'direct-stream' | 'youtube-iframe';

export interface DeckState {
  id: 'A' | 'B';
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number; // 0 to 100
  pitchPercent: number; // -16 to +16
  playbackRate: number; // 0.25 to 2.0
  bpm: number;
  highEq: number; // -100 to +100 (0 neutral)
  midEq: number; // -100 to +100
  lowEq: number; // -100 to +100
  filter: number; // -100 (LPF) to +100 (HPF), 0 neutral
  highKill: boolean;
  midKill: boolean;
  lowKill: boolean;
  cuePoint: number;
  hotCues: (HotCue | null)[];
  isLooping: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  loopLengthBeats: number;
  slipMode: boolean;
  keyLock: boolean;
  jogRotation: number;
  engine: PlaybackEngine;
  directStreamUrl?: string | null;
  audioStreamUrl?: string | null;
  isLocalFile?: boolean;
  availableFormats?: MediaFormat[];
  ytdlpCommand?: string;
}

export type CrossfaderCurve = 'linear' | 'cut' | 'smooth';

export type VideoDisplayMode = 'crossfader' | 'split' | 'pip-a' | 'pip-b' | 'solo-a' | 'solo-b' | 'vinyl';

export type VideoFilter = 'none' | 'crt' | 'neon' | 'noir' | 'strobe';

export interface MashupPreset {
  id: string;
  name: string;
  genre: string;
  deckA: {
    videoId: string;
    title: string;
    artist: string;
    bpm: number;
    cuePoint?: number;
  };
  deckB: {
    videoId: string;
    title: string;
    artist: string;
    bpm: number;
    cuePoint?: number;
  };
  notes: string;
}

export interface MixEvent {
  timestamp: string;
  timeInSec: number;
  description: string;
  deck: 'A' | 'B' | 'MIXER';
}
