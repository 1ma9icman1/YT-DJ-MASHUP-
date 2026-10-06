import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DeckState,
  CrossfaderCurve,
  VideoDisplayMode,
  VideoFilter,
  MashupPreset,
  MixEvent,
} from './types/dj';
import { DEFAULT_MASHUP_PRESETS } from './data/mashups';
import { loadYouTubeIframeApi, extractYouTubeVideoId } from './utils/youtube';
import { djAudio } from './utils/audioFX';
import { Header } from './components/Header';
import { VideoMashupStage } from './components/VideoMashupStage';
import { DeckController } from './components/DeckController';
import { MixerSection } from './components/MixerSection';
import { SamplerPads } from './components/SamplerPads';
import { MashupPresetsModal } from './components/MashupPresetsModal';
import { SingleTrackLoaderModal } from './components/SingleTrackLoaderModal';
import { SessionRecorderModal } from './components/SessionRecorderModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { YtDownloaderModal } from './components/YtDownloaderModal';

const initialDeckA: DeckState = {
  id: 'A',
  videoId: DEFAULT_MASHUP_PRESETS[0].deckA.videoId,
  title: DEFAULT_MASHUP_PRESETS[0].deckA.title,
  artist: DEFAULT_MASHUP_PRESETS[0].deckA.artist,
  thumbnail: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isBuffering: false,
  volume: 100,
  pitchPercent: 0,
  playbackRate: 1.0,
  bpm: DEFAULT_MASHUP_PRESETS[0].deckA.bpm,
  highEq: 0,
  midEq: 0,
  lowEq: 0,
  filter: 0,
  highKill: false,
  midKill: false,
  lowKill: false,
  cuePoint: 0,
  hotCues: [null, null, null, null],
  isLooping: false,
  loopStart: null,
  loopEnd: null,
  loopLengthBeats: 4,
  slipMode: false,
  keyLock: true,
  jogRotation: 0,
  engine: 'youtube-iframe',
  directStreamUrl: null,
};

const initialDeckB: DeckState = {
  id: 'B',
  videoId: DEFAULT_MASHUP_PRESETS[0].deckB.videoId,
  title: DEFAULT_MASHUP_PRESETS[0].deckB.title,
  artist: DEFAULT_MASHUP_PRESETS[0].deckB.artist,
  thumbnail: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isBuffering: false,
  volume: 100,
  pitchPercent: 0,
  playbackRate: 1.0,
  bpm: DEFAULT_MASHUP_PRESETS[0].deckB.bpm,
  highEq: 0,
  midEq: 0,
  lowEq: 0,
  filter: 0,
  highKill: false,
  midKill: false,
  lowKill: false,
  cuePoint: 12,
  hotCues: [null, null, null, null],
  isLooping: false,
  loopStart: null,
  loopEnd: null,
  loopLengthBeats: 4,
  slipMode: false,
  keyLock: true,
  jogRotation: 0,
  engine: 'youtube-iframe',
  directStreamUrl: null,
};

export default function App() {
  const [deckA, setDeckA] = useState<DeckState>(initialDeckA);
  const [deckB, setDeckB] = useState<DeckState>(initialDeckB);

  // Mixer State
  const [crossfader, setCrossfader] = useState<number>(0); // -1.0 to +1.0
  const [crossfaderCurve, setCrossfaderCurve] = useState<CrossfaderCurve>('smooth');
  const [masterVolume, setMasterVolume] = useState<number>(100);
  const [videoMode, setVideoMode] = useState<VideoDisplayMode>('crossfader');
  const [videoFilter, setVideoFilter] = useState<VideoFilter>('none');
  const [isAutoFading, setIsAutoFading] = useState<boolean>(false);
  const [cueDeckA, setCueDeckA] = useState<boolean>(false);
  const [cueDeckB, setCueDeckB] = useState<boolean>(false);

  // Active top navigation section
  const [activeNav, setActiveNav] = useState<string>('decks');

  // Modals state
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);
  const [isDownloaderOpen, setIsDownloaderOpen] = useState<boolean>(false);
  const [singleLoadDeck, setSingleLoadDeck] = useState<'A' | 'B' | null>(null);

  // Session Logger
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sessionEvents, setSessionEvents] = useState<MixEvent[]>([]);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Player DOM refs & YouTube Player instances
  const containerRefA = useRef<HTMLDivElement>(null);
  const containerRefB = useRef<HTMLDivElement>(null);
  const playerARef = useRef<any>(null);
  const playerBRef = useRef<any>(null);

  // HTML5 Direct Stream Video Elements (ytDownloader direct streams & local files)
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  // BPM Tap detector refs
  const tapTimesARef = useRef<number[]>([]);
  const tapTimesBRef = useRef<number[]>([]);

  // Log session event helper
  const logMixEvent = useCallback((description: string, deck: 'A' | 'B' | 'MIXER' = 'MIXER') => {
    if (!isRecording) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const durationSec = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;

    setSessionEvents((prev) => [
      ...prev,
      {
        timestamp: timeStr,
        timeInSec: durationSec,
        description,
        deck,
      },
    ]);
  }, [isRecording]);

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (sessionStartTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Mount YouTube Players
  useEffect(() => {
    let isMounted = true;

    loadYouTubeIframeApi().then(() => {
      if (!isMounted || !window.YT) return;

      // Initialize Player A
      if (containerRefA.current && !playerARef.current) {
        const divA = document.createElement('div');
        containerRefA.current.appendChild(divA);

        playerARef.current = new window.YT.Player(divA, {
          videoId: deckA.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              const dur = e.target.getDuration() || 0;
              setDeckA((prev) => ({
                ...prev,
                duration: dur,
              }));
            },
            onStateChange: (e: any) => {
              const isPlaying = e.data === window.YT.PlayerState.PLAYING;
              const isBuffering = e.data === window.YT.PlayerState.BUFFERING;
              setDeckA((prev) => ({
                ...prev,
                isPlaying,
                isBuffering,
              }));
              if (isPlaying) {
                logMixEvent(`Started playback: ${deckA.title}`, 'A');
              }
            },
          },
        });
      }

      // Initialize Player B
      if (containerRefB.current && !playerBRef.current) {
        const divB = document.createElement('div');
        containerRefB.current.appendChild(divB);

        playerBRef.current = new window.YT.Player(divB, {
          videoId: deckB.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              const dur = e.target.getDuration() || 0;
              setDeckB((prev) => ({
                ...prev,
                duration: dur,
              }));
            },
            onStateChange: (e: any) => {
              const isPlaying = e.data === window.YT.PlayerState.PLAYING;
              const isBuffering = e.data === window.YT.PlayerState.BUFFERING;
              setDeckB((prev) => ({
                ...prev,
                isPlaying,
                isBuffering,
              }));
              if (isPlaying) {
                logMixEvent(`Started playback: ${deckB.title}`, 'B');
              }
            },
          },
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate volume based on Crossfader Curve & Channel Levels
  const computeChannelGain = useCallback(
    (deckId: 'A' | 'B', x: number, curve: CrossfaderCurve) => {
      if (curve === 'linear') {
        return deckId === 'A' ? (1 - x) / 2 : (x + 1) / 2;
      } else if (curve === 'cut') {
        if (deckId === 'A') {
          return x >= 0.96 ? 0 : 1;
        } else {
          return x <= -0.96 ? 0 : 1;
        }
      } else {
        // smooth / equal-power curve
        if (deckId === 'A') {
          return Math.cos(((x + 1) / 4) * Math.PI);
        } else {
          return Math.sin(((x + 1) / 4) * Math.PI);
        }
      }
    },
    []
  );

  // Sync Audio Volumes to YouTube Players
  useEffect(() => {
    const gainA = computeChannelGain('A', crossfader, crossfaderCurve);
    const gainB = computeChannelGain('B', crossfader, crossfaderCurve);

    // Deck A volume
    let finalVolA = (deckA.volume / 100) * gainA * (masterVolume / 100) * 100;
    if (deckA.lowKill && deckA.midKill && deckA.highKill) finalVolA = 0;
    if (videoRefA.current) {
      videoRefA.current.volume = Math.max(0, Math.min(1, finalVolA / 100));
    }
    if (playerARef.current && typeof playerARef.current.setVolume === 'function') {
      try {
        playerARef.current.setVolume(Math.round(Math.max(0, Math.min(100, finalVolA))));
      } catch {}
    }

    // Deck B volume
    let finalVolB = (deckB.volume / 100) * gainB * (masterVolume / 100) * 100;
    if (deckB.lowKill && deckB.midKill && deckB.highKill) finalVolB = 0;
    if (videoRefB.current) {
      videoRefB.current.volume = Math.max(0, Math.min(1, finalVolB / 100));
    }
    if (playerBRef.current && typeof playerBRef.current.setVolume === 'function') {
      try {
        playerBRef.current.setVolume(Math.round(Math.max(0, Math.min(100, finalVolB))));
      } catch {}
    }
  }, [
    crossfader,
    crossfaderCurve,
    masterVolume,
    deckA.volume,
    deckA.lowKill,
    deckA.midKill,
    deckA.highKill,
    deckB.volume,
    deckB.lowKill,
    deckB.midKill,
    deckB.highKill,
    computeChannelGain,
  ]);

  // High-frequency polling loop for Timecode, Waveform, and Loop Boundary
  useEffect(() => {
    const interval = setInterval(() => {
      // Check Deck A
      if (deckA.directStreamUrl && videoRefA.current) {
        const vA = videoRefA.current;
        const tA = vA.currentTime || 0;
        const durA = vA.duration || deckA.duration;
        setDeckA((prev) => {
          if (prev.isLooping && prev.loopEnd && tA >= prev.loopEnd && prev.loopStart !== null) {
            vA.currentTime = prev.loopStart;
            return { ...prev, currentTime: prev.loopStart, duration: durA || prev.duration };
          }
          return { ...prev, currentTime: tA, duration: durA || prev.duration };
        });
      } else if (playerARef.current && typeof playerARef.current.getCurrentTime === 'function') {
        try {
          const tA = playerARef.current.getCurrentTime() || 0;
          setDeckA((prev) => {
            if (prev.isLooping && prev.loopEnd && tA >= prev.loopEnd && prev.loopStart !== null) {
              playerARef.current.seekTo(prev.loopStart, true);
              return { ...prev, currentTime: prev.loopStart };
            }
            return { ...prev, currentTime: tA };
          });
        } catch {}
      }

      // Check Deck B
      if (deckB.directStreamUrl && videoRefB.current) {
        const vB = videoRefB.current;
        const tB = vB.currentTime || 0;
        const durB = vB.duration || deckB.duration;
        setDeckB((prev) => {
          if (prev.isLooping && prev.loopEnd && tB >= prev.loopEnd && prev.loopStart !== null) {
            vB.currentTime = prev.loopStart;
            return { ...prev, currentTime: prev.loopStart, duration: durB || prev.duration };
          }
          return { ...prev, currentTime: tB, duration: durB || prev.duration };
        });
      } else if (playerBRef.current && typeof playerBRef.current.getCurrentTime === 'function') {
        try {
          const tB = playerBRef.current.getCurrentTime() || 0;
          setDeckB((prev) => {
            if (prev.isLooping && prev.loopEnd && tB >= prev.loopEnd && prev.loopStart !== null) {
              playerBRef.current.seekTo(prev.loopStart, true);
              return { ...prev, currentTime: prev.loopStart };
            }
            return { ...prev, currentTime: tB };
          });
        } catch {}
      }
    }, 80);

    return () => clearInterval(interval);
  }, [deckA.directStreamUrl, deckB.directStreamUrl]);

  // --- DECK A CONTROLS ---
  const handlePlayPauseA = () => {
    if (deckA.directStreamUrl && videoRefA.current) {
      if (deckA.isPlaying) {
        videoRefA.current.pause();
        setDeckA((prev) => ({ ...prev, isPlaying: false }));
        logMixEvent(`Paused Deck A`, 'A');
      } else {
        videoRefA.current.play();
        setDeckA((prev) => ({ ...prev, isPlaying: true }));
        logMixEvent(`Playing Deck A (Direct Stream)`, 'A');
      }
      return;
    }
    if (!playerARef.current) return;
    try {
      if (deckA.isPlaying) {
        playerARef.current.pauseVideo();
        logMixEvent(`Paused Deck A`, 'A');
      } else {
        playerARef.current.playVideo();
        logMixEvent(`Playing Deck A`, 'A');
      }
    } catch {}
  };

  const handleCueA = () => {
    if (deckA.directStreamUrl && videoRefA.current) {
      videoRefA.current.pause();
      videoRefA.current.currentTime = deckA.cuePoint;
      setDeckA((prev) => ({ ...prev, isPlaying: false, currentTime: deckA.cuePoint }));
      djAudio.playClick();
      logMixEvent(`Cued Deck A to ${deckA.cuePoint.toFixed(1)}s`, 'A');
      return;
    }
    if (!playerARef.current) return;
    try {
      playerARef.current.pauseVideo();
      playerARef.current.seekTo(deckA.cuePoint, true);
      djAudio.playClick();
      logMixEvent(`Cued Deck A to ${deckA.cuePoint.toFixed(1)}s`, 'A');
    } catch {}
  };

  const handleSetCuePointA = () => {
    const current = deckA.currentTime;
    setDeckA((prev) => ({ ...prev, cuePoint: current }));
    djAudio.playClick();
    logMixEvent(`Set Cue Point on Deck A to ${current.toFixed(1)}s`, 'A');
  };

  const handleHotCueA = (index: number) => {
    const existing = deckA.hotCues[index];
    if (existing) {
      if (deckA.directStreamUrl && videoRefA.current) {
        videoRefA.current.currentTime = existing.time;
        if (!deckA.isPlaying) {
          videoRefA.current.play();
          setDeckA((prev) => ({ ...prev, isPlaying: true }));
        }
      } else if (playerARef.current) {
        playerARef.current.seekTo(existing.time, true);
        if (!deckA.isPlaying) playerARef.current.playVideo();
      }
      djAudio.playClick();
      logMixEvent(`Triggered Hot Cue ${index + 1} (${existing.time.toFixed(1)}s)`, 'A');
    } else {
      // Set new cue
      const newCue = { id: index + 1, time: deckA.currentTime, label: `Cue ${index + 1}` };
      setDeckA((prev) => {
        const nextCues = [...prev.hotCues];
        nextCues[index] = newCue;
        return { ...prev, hotCues: nextCues };
      });
      djAudio.playClick();
      logMixEvent(`Set Hot Cue ${index + 1} on Deck A`, 'A');
    }
  };

  const handleClearHotCueA = (index: number) => {
    setDeckA((prev) => {
      const nextCues = [...prev.hotCues];
      nextCues[index] = null;
      return { ...prev, hotCues: nextCues };
    });
    logMixEvent(`Cleared Hot Cue ${index + 1} on Deck A`, 'A');
  };

  const handleSetLoopA = (beats: number) => {
    const beatSec = 60 / (deckA.bpm || 120);
    const start = deckA.currentTime;
    const end = start + beatSec * beats;
    setDeckA((prev) => ({
      ...prev,
      isLooping: true,
      loopStart: start,
      loopEnd: end,
      loopLengthBeats: beats,
    }));
    logMixEvent(`Active Loop ${beats} beats on Deck A`, 'A');
  };

  const handleToggleLoopA = () => {
    if (deckA.isLooping) {
      setDeckA((prev) => ({ ...prev, isLooping: false, loopStart: null, loopEnd: null }));
    } else {
      handleSetLoopA(deckA.loopLengthBeats || 4);
    }
  };

  const handleHalveLoopA = () => {
    const newBeats = Math.max(1, Math.floor(deckA.loopLengthBeats / 2));
    handleSetLoopA(newBeats);
  };

  const handleDoubleLoopA = () => {
    const newBeats = Math.min(32, deckA.loopLengthBeats * 2);
    handleSetLoopA(newBeats);
  };

  const handlePitchChangeA = (pitchPercent: number) => {
    const rate = 1 + pitchPercent / 100;
    setDeckA((prev) => ({
      ...prev,
      pitchPercent,
      playbackRate: rate,
      bpm: (DEFAULT_MASHUP_PRESETS[0].deckA.bpm || 120) * rate,
    }));
    if (deckA.directStreamUrl && videoRefA.current) {
      videoRefA.current.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    }
    if (playerARef.current && typeof playerARef.current.setPlaybackRate === 'function') {
      try {
        playerARef.current.setPlaybackRate(Math.max(0.25, Math.min(2.0, rate)));
      } catch {}
    }
  };

  const handleSyncA = () => {
    // Match BPM to Deck B
    const targetBpm = deckB.bpm;
    const baseBpm = DEFAULT_MASHUP_PRESETS[0].deckA.bpm || 120;
    const pitch = ((targetBpm - baseBpm) / baseBpm) * 100;
    handlePitchChangeA(Math.round(pitch * 10) / 10);
    logMixEvent(`Synced Deck A to Deck B (${targetBpm.toFixed(1)} BPM)`, 'A');
  };

  const handleTapBpmA = () => {
    const now = Date.now();
    tapTimesARef.current.push(now);
    if (tapTimesARef.current.length > 5) tapTimesARef.current.shift();

    if (tapTimesARef.current.length >= 2) {
      const diffs = [];
      for (let i = 1; i < tapTimesARef.current.length; i++) {
        diffs.push(tapTimesARef.current[i] - tapTimesARef.current[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const detectedBpm = Math.round((60000 / avgDiff) * 10) / 10;
      if (detectedBpm >= 60 && detectedBpm <= 200) {
        setDeckA((prev) => ({ ...prev, bpm: detectedBpm }));
      }
    }
  };

  const handleNudgeA = (deltaSeconds: number) => {
    if (deckA.directStreamUrl && videoRefA.current) {
      const nextTime = Math.max(0, videoRefA.current.currentTime + deltaSeconds);
      videoRefA.current.currentTime = nextTime;
      return;
    }
    if (!playerARef.current) return;
    try {
      const nextTime = Math.max(0, deckA.currentTime + deltaSeconds);
      playerARef.current.seekTo(nextTime, true);
    } catch {}
  };

  const handleScrubA = (deltaSeconds: number) => {
    if (deckA.directStreamUrl && videoRefA.current) {
      const nextTime = Math.max(0, Math.min(deckA.duration, videoRefA.current.currentTime + deltaSeconds));
      videoRefA.current.currentTime = nextTime;
      return;
    }
    if (!playerARef.current) return;
    try {
      const nextTime = Math.max(0, Math.min(deckA.duration, deckA.currentTime + deltaSeconds));
      playerARef.current.seekTo(nextTime, true);
    } catch {}
  };

  const handleSpinbackA = () => {
    djAudio.playRewind();
    handleNudgeA(-2.5);
    logMixEvent(`Spinback FX on Deck A`, 'A');
  };

  // --- DECK B CONTROLS ---
  const handlePlayPauseB = () => {
    if (deckB.directStreamUrl && videoRefB.current) {
      if (deckB.isPlaying) {
        videoRefB.current.pause();
        setDeckB((prev) => ({ ...prev, isPlaying: false }));
        logMixEvent(`Paused Deck B`, 'B');
      } else {
        videoRefB.current.play();
        setDeckB((prev) => ({ ...prev, isPlaying: true }));
        logMixEvent(`Playing Deck B (Direct Stream)`, 'B');
      }
      return;
    }
    if (!playerBRef.current) return;
    try {
      if (deckB.isPlaying) {
        playerBRef.current.pauseVideo();
        logMixEvent(`Paused Deck B`, 'B');
      } else {
        playerBRef.current.playVideo();
        logMixEvent(`Playing Deck B`, 'B');
      }
    } catch {}
  };

  const handleCueB = () => {
    if (deckB.directStreamUrl && videoRefB.current) {
      videoRefB.current.pause();
      videoRefB.current.currentTime = deckB.cuePoint;
      setDeckB((prev) => ({ ...prev, isPlaying: false, currentTime: deckB.cuePoint }));
      djAudio.playClick();
      logMixEvent(`Cued Deck B to ${deckB.cuePoint.toFixed(1)}s`, 'B');
      return;
    }
    if (!playerBRef.current) return;
    try {
      playerBRef.current.pauseVideo();
      playerBRef.current.seekTo(deckB.cuePoint, true);
      djAudio.playClick();
      logMixEvent(`Cued Deck B to ${deckB.cuePoint.toFixed(1)}s`, 'B');
    } catch {}
  };

  const handleSetCuePointB = () => {
    const current = deckB.currentTime;
    setDeckB((prev) => ({ ...prev, cuePoint: current }));
    djAudio.playClick();
    logMixEvent(`Set Cue Point on Deck B to ${current.toFixed(1)}s`, 'B');
  };

  const handleHotCueB = (index: number) => {
    const existing = deckB.hotCues[index];
    if (existing) {
      if (deckB.directStreamUrl && videoRefB.current) {
        videoRefB.current.currentTime = existing.time;
        if (!deckB.isPlaying) {
          videoRefB.current.play();
          setDeckB((prev) => ({ ...prev, isPlaying: true }));
        }
      } else if (playerBRef.current) {
        playerBRef.current.seekTo(existing.time, true);
        if (!deckB.isPlaying) playerBRef.current.playVideo();
      }
      djAudio.playClick();
      logMixEvent(`Triggered Hot Cue ${index + 1} (${existing.time.toFixed(1)}s)`, 'B');
    } else {
      // Set new cue
      const newCue = { id: index + 1, time: deckB.currentTime, label: `Cue ${index + 1}` };
      setDeckB((prev) => {
        const nextCues = [...prev.hotCues];
        nextCues[index] = newCue;
        return { ...prev, hotCues: nextCues };
      });
      djAudio.playClick();
      logMixEvent(`Set Hot Cue ${index + 1} on Deck B`, 'B');
    }
  };

  const handleClearHotCueB = (index: number) => {
    setDeckB((prev) => {
      const nextCues = [...prev.hotCues];
      nextCues[index] = null;
      return { ...prev, hotCues: nextCues };
    });
    logMixEvent(`Cleared Hot Cue ${index + 1} on Deck B`, 'B');
  };

  const handleSetLoopB = (beats: number) => {
    const beatSec = 60 / (deckB.bpm || 120);
    const start = deckB.currentTime;
    const end = start + beatSec * beats;
    setDeckB((prev) => ({
      ...prev,
      isLooping: true,
      loopStart: start,
      loopEnd: end,
      loopLengthBeats: beats,
    }));
    logMixEvent(`Active Loop ${beats} beats on Deck B`, 'B');
  };

  const handleToggleLoopB = () => {
    if (deckB.isLooping) {
      setDeckB((prev) => ({ ...prev, isLooping: false, loopStart: null, loopEnd: null }));
    } else {
      handleSetLoopB(deckB.loopLengthBeats || 4);
    }
  };

  const handleHalveLoopB = () => {
    const newBeats = Math.max(1, Math.floor(deckB.loopLengthBeats / 2));
    handleSetLoopB(newBeats);
  };

  const handleDoubleLoopB = () => {
    const newBeats = Math.min(32, deckB.loopLengthBeats * 2);
    handleSetLoopB(newBeats);
  };

  const handlePitchChangeB = (pitchPercent: number) => {
    const rate = 1 + pitchPercent / 100;
    setDeckB((prev) => ({
      ...prev,
      pitchPercent,
      playbackRate: rate,
      bpm: (DEFAULT_MASHUP_PRESETS[0].deckB.bpm || 114) * rate,
    }));
    if (deckB.directStreamUrl && videoRefB.current) {
      videoRefB.current.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    }
    if (playerBRef.current && typeof playerBRef.current.setPlaybackRate === 'function') {
      try {
        playerBRef.current.setPlaybackRate(Math.max(0.25, Math.min(2.0, rate)));
      } catch {}
    }
  };

  const handleSyncB = () => {
    // Match BPM to Deck A
    const targetBpm = deckA.bpm;
    const baseBpm = DEFAULT_MASHUP_PRESETS[0].deckB.bpm || 114;
    const pitch = ((targetBpm - baseBpm) / baseBpm) * 100;
    handlePitchChangeB(Math.round(pitch * 10) / 10);
    logMixEvent(`Synced Deck B to Deck A (${targetBpm.toFixed(1)} BPM)`, 'B');
  };

  const handleTapBpmB = () => {
    const now = Date.now();
    tapTimesBRef.current.push(now);
    if (tapTimesBRef.current.length > 5) tapTimesBRef.current.shift();

    if (tapTimesBRef.current.length >= 2) {
      const diffs = [];
      for (let i = 1; i < tapTimesBRef.current.length; i++) {
        diffs.push(tapTimesBRef.current[i] - tapTimesBRef.current[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const detectedBpm = Math.round((60000 / avgDiff) * 10) / 10;
      if (detectedBpm >= 60 && detectedBpm <= 200) {
        setDeckB((prev) => ({ ...prev, bpm: detectedBpm }));
      }
    }
  };

  const handleNudgeB = (deltaSeconds: number) => {
    if (deckB.directStreamUrl && videoRefB.current) {
      const nextTime = Math.max(0, videoRefB.current.currentTime + deltaSeconds);
      videoRefB.current.currentTime = nextTime;
      return;
    }
    if (!playerBRef.current) return;
    try {
      const nextTime = Math.max(0, deckB.currentTime + deltaSeconds);
      playerBRef.current.seekTo(nextTime, true);
    } catch {}
  };

  const handleScrubB = (deltaSeconds: number) => {
    if (deckB.directStreamUrl && videoRefB.current) {
      const nextTime = Math.max(0, Math.min(deckB.duration, videoRefB.current.currentTime + deltaSeconds));
      videoRefB.current.currentTime = nextTime;
      return;
    }
    if (!playerBRef.current) return;
    try {
      const nextTime = Math.max(0, Math.min(deckB.duration, deckB.currentTime + deltaSeconds));
      playerBRef.current.seekTo(nextTime, true);
    } catch {}
  };

  const handleSpinbackB = () => {
    djAudio.playRewind();
    handleNudgeB(-2.5);
    logMixEvent(`Spinback FX on Deck B`, 'B');
  };

  // --- AUTO-FADE TRANSITION ---
  const handleAutoFade = (target: 'A' | 'B' | 'CENTER', durationSec: number) => {
    if (isAutoFading) return;
    setIsAutoFading(true);

    const targetPos = target === 'A' ? -1 : target === 'B' ? 1 : 0;
    const startPos = crossfader;
    const distance = targetPos - startPos;
    const totalFrames = durationSec * 60;
    let frame = 0;

    logMixEvent(`Auto-Fading to ${target} (${durationSec}s)`, 'MIXER');

    const animateFade = () => {
      frame++;
      const progress = frame / totalFrames;
      // Ease in-out
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const currentPos = startPos + distance * Math.min(1, ease);
      setCrossfader(Math.max(-1, Math.min(1, currentPos)));

      if (frame < totalFrames) {
        requestAnimationFrame(animateFade);
      } else {
        setCrossfader(targetPos);
        setIsAutoFading(false);
      }
    };

    requestAnimationFrame(animateFade);
  };

  // --- PRESET SELECTION ---
  const handleSelectPreset = (preset: MashupPreset) => {
    logMixEvent(`Loaded Preset: ${preset.name}`, 'MIXER');

    // Update Deck A
    setDeckA((prev) => ({
      ...prev,
      videoId: preset.deckA.videoId,
      title: preset.deckA.title,
      artist: preset.deckA.artist,
      bpm: preset.deckA.bpm,
      cuePoint: preset.deckA.cuePoint || 0,
      pitchPercent: 0,
      currentTime: 0,
      isPlaying: false,
    }));
    if (playerARef.current && typeof playerARef.current.loadVideoById === 'function') {
      try {
        playerARef.current.loadVideoById(preset.deckA.videoId, preset.deckA.cuePoint || 0);
        playerARef.current.pauseVideo();
      } catch {}
    }

    // Update Deck B
    setDeckB((prev) => ({
      ...prev,
      videoId: preset.deckB.videoId,
      title: preset.deckB.title,
      artist: preset.deckB.artist,
      bpm: preset.deckB.bpm,
      cuePoint: preset.deckB.cuePoint || 0,
      pitchPercent: 0,
      currentTime: 0,
      isPlaying: false,
    }));
    if (playerBRef.current && typeof playerBRef.current.loadVideoById === 'function') {
      try {
        playerBRef.current.loadVideoById(preset.deckB.videoId, preset.deckB.cuePoint || 0);
        playerBRef.current.pauseVideo();
      } catch {}
    }
  };

  // --- LOAD CUSTOM PAIR ---
  const handleLoadCustomPair = (
    deckAData: { videoId: string; title: string; bpm: number },
    deckBData: { videoId: string; title: string; bpm: number }
  ) => {
    logMixEvent(`Loaded Custom Pair: ${deckAData.title} & ${deckBData.title}`, 'MIXER');

    setDeckA((prev) => ({
      ...prev,
      videoId: deckAData.videoId,
      title: deckAData.title,
      bpm: deckAData.bpm,
      currentTime: 0,
      isPlaying: false,
    }));
    if (playerARef.current && typeof playerARef.current.loadVideoById === 'function') {
      try {
        playerARef.current.loadVideoById(deckAData.videoId);
        playerARef.current.pauseVideo();
      } catch {}
    }

    setDeckB((prev) => ({
      ...prev,
      videoId: deckBData.videoId,
      title: deckBData.title,
      bpm: deckBData.bpm,
      currentTime: 0,
      isPlaying: false,
    }));
    if (playerBRef.current && typeof playerBRef.current.loadVideoById === 'function') {
      try {
        playerBRef.current.loadVideoById(deckBData.videoId);
        playerBRef.current.pauseVideo();
      } catch {}
    }
  };

  // --- LOAD SINGLE TRACK ---
  const handleLoadSingleTrack = (trackData: { videoId: string; title: string; bpm: number }) => {
    if (singleLoadDeck === 'A') {
      setDeckA((prev) => ({
        ...prev,
        videoId: trackData.videoId,
        title: trackData.title,
        bpm: trackData.bpm,
        currentTime: 0,
        isPlaying: false,
        directStreamUrl: null,
      }));
      if (playerARef.current && typeof playerARef.current.loadVideoById === 'function') {
        try {
          playerARef.current.loadVideoById(trackData.videoId);
          playerARef.current.pauseVideo();
        } catch {}
      }
      logMixEvent(`Loaded track to Deck A: ${trackData.title}`, 'A');
    } else if (singleLoadDeck === 'B') {
      setDeckB((prev) => ({
        ...prev,
        videoId: trackData.videoId,
        title: trackData.title,
        bpm: trackData.bpm,
        currentTime: 0,
        isPlaying: false,
        directStreamUrl: null,
      }));
      if (playerBRef.current && typeof playerBRef.current.loadVideoById === 'function') {
        try {
          playerBRef.current.loadVideoById(trackData.videoId);
          playerBRef.current.pauseVideo();
        } catch {}
      }
      logMixEvent(`Loaded track to Deck B: ${trackData.title}`, 'B');
    }
    setSingleLoadDeck(null);
  };

  // --- LOAD FROM ytDownloader STREAM GRABBER ---
  const handleLoadFromDownloader = (
    deckId: 'A' | 'B',
    data: {
      videoId: string;
      title: string;
      artist: string;
      thumbnail: string;
      duration: number;
      directStreamUrl?: string;
      audioStreamUrl?: string;
      isLocalFile?: boolean;
      formats?: any[];
      ytdlpCommand?: string;
    }
  ) => {
    const isA = deckId === 'A';
    const targetSetter = isA ? setDeckA : setDeckB;
    const targetPlayerRef = isA ? playerARef : playerBRef;
    const targetVideoRef = isA ? videoRefA : videoRefB;

    targetSetter((prev) => ({
      ...prev,
      videoId: data.videoId,
      title: data.title,
      artist: data.artist,
      thumbnail: data.thumbnail,
      duration: data.duration || prev.duration,
      directStreamUrl: data.directStreamUrl || null,
      audioStreamUrl: data.audioStreamUrl || null,
      isLocalFile: !!data.isLocalFile,
      engine: data.directStreamUrl ? 'direct-stream' : 'youtube-iframe',
      availableFormats: data.formats,
      ytdlpCommand: data.ytdlpCommand,
      currentTime: 0,
      isPlaying: false,
      pitchPercent: 0,
    }));

    if (data.directStreamUrl) {
      try {
        targetPlayerRef.current?.pauseVideo();
      } catch {}
      if (targetVideoRef.current) {
        targetVideoRef.current.src = data.directStreamUrl;
        targetVideoRef.current.currentTime = 0;
        targetVideoRef.current.pause();
      }
    } else {
      try {
        targetPlayerRef.current?.loadVideoById(data.videoId);
        targetPlayerRef.current?.pauseVideo();
      } catch {}
    }

    logMixEvent(
      `Loaded via ytDownloader into Deck ${deckId}: ${data.title} (${
        data.directStreamUrl ? 'Direct HTML5 Stream' : 'YouTube IFrame'
      })`,
      deckId
    );
  };

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in form inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Space: Play/Pause Deck A or B
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePlayPauseB();
        } else {
          handlePlayPauseA();
        }
      }

      // Q: Cue A
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleCueA();
      }

      // P: Cue B
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleCueB();
      }

      // Hot Cues Deck A: 1, 2, 3, 4
      if (['1', '2', '3', '4'].includes(e.key) && !e.shiftKey) {
        const idx = parseInt(e.key) - 1;
        handleHotCueA(idx);
      }

      // Hot Cues Deck B: 7, 8, 9, 0
      if (['7', '8', '9', '0'].includes(e.key)) {
        const map: { [key: string]: number } = { '7': 0, '8': 1, '9': 2, '0': 3 };
        handleHotCueB(map[e.key]);
      }

      // Crossfader nudges: [ and ]
      if (e.key === '[') {
        if (e.shiftKey) {
          setCrossfader(-1);
        } else {
          setCrossfader((curr) => Math.max(-1, Math.round((curr - 0.1) * 100) / 100));
        }
      }
      if (e.key === ']') {
        if (e.shiftKey) {
          setCrossfader(1);
        } else {
          setCrossfader((curr) => Math.min(1, Math.round((curr + 0.1) * 100) / 100));
        }
      }
      if (e.key === '\\') {
        setCrossfader(0);
      }

      // Beat Sync: A and B
      if (e.key === 'a' || e.key === 'A') {
        handleSyncA();
      }
      if (e.key === 'b' || e.key === 'B') {
        handleSyncB();
      }

      // Loops: L (Deck A) / Shift+L (Deck B)
      if (e.key === 'l' || e.key === 'L') {
        if (e.shiftKey) {
          handleToggleLoopB();
        } else {
          handleToggleLoopA();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    deckA.isPlaying,
    deckA.cuePoint,
    deckA.currentTime,
    deckA.hotCues,
    deckA.bpm,
    deckB.isPlaying,
    deckB.cuePoint,
    deckB.currentTime,
    deckB.hotCues,
    deckB.bpm,
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenDownloader={() => setIsDownloaderOpen(true)}
        isRecording={isRecording}
        activeSection={activeNav}
        setActiveSection={setActiveNav}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-4 space-y-4">
        {/* VIDEO MASHUP STAGE */}
        <section id="decks-section" className="space-y-4">
          <VideoMashupStage
            deckA={deckA}
            deckB={deckB}
            crossfader={crossfader}
            videoMode={videoMode}
            videoFilter={videoFilter}
            containerRefA={containerRefA}
            containerRefB={containerRefB}
            videoRefA={videoRefA}
            videoRefB={videoRefB}
            masterVolume={masterVolume}
          />

          {/* DUAL DECK & MIXER HARDWARE WORKSTATION */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* DECK A CONTROLLER (5 COLS) */}
            <div className="xl:col-span-5">
              <DeckController
                deck={deckA}
                otherDeck={deckB}
                onPlayPause={handlePlayPauseA}
                onCue={handleCueA}
                onSetCuePoint={handleSetCuePointA}
                onHotCue={handleHotCueA}
                onClearHotCue={handleClearHotCueA}
                onSetLoop={handleSetLoopA}
                onToggleLoop={handleToggleLoopA}
                onHalveLoop={handleHalveLoopA}
                onDoubleLoop={handleDoubleLoopA}
                onPitchChange={handlePitchChangeA}
                onSync={handleSyncA}
                onTapBpm={handleTapBpmA}
                onNudge={handleNudgeA}
                onScrub={handleScrubA}
                onVolumeChange={(vol) => setDeckA((prev) => ({ ...prev, volume: vol }))}
                onHighEqChange={(val) => setDeckA((prev) => ({ ...prev, highEq: val }))}
                onMidEqChange={(val) => setDeckA((prev) => ({ ...prev, midEq: val }))}
                onLowEqChange={(val) => setDeckA((prev) => ({ ...prev, lowEq: val }))}
                onFilterChange={(val) => setDeckA((prev) => ({ ...prev, filter: val }))}
                onToggleHighKill={() => setDeckA((prev) => ({ ...prev, highKill: !prev.highKill }))}
                onToggleMidKill={() => setDeckA((prev) => ({ ...prev, midKill: !prev.midKill }))}
                onToggleLowKill={() => setDeckA((prev) => ({ ...prev, lowKill: !prev.lowKill }))}
                onToggleHeadphoneCue={() => setCueDeckA(!cueDeckA)}
                isHeadphoneCue={cueDeckA}
                onLoadCustomTrack={() => setSingleLoadDeck('A')}
                onSpinback={handleSpinbackA}
              />
            </div>

            {/* CENTRAL MIXER SECTION (2 COLS on XL, expanded on mobile/tablet) */}
            <div className="xl:col-span-2">
              <MixerSection
                crossfader={crossfader}
                onCrossfaderChange={setCrossfader}
                crossfaderCurve={crossfaderCurve}
                onCurveChange={setCrossfaderCurve}
                masterVolume={masterVolume}
                onMasterVolumeChange={setMasterVolume}
                videoMode={videoMode}
                onVideoModeChange={setVideoMode}
                videoFilter={videoFilter}
                onVideoFilterChange={setVideoFilter}
                onAutoFade={handleAutoFade}
                isAutoFading={isAutoFading}
                cueDeckA={cueDeckA}
                cueDeckB={cueDeckB}
                onToggleCueA={() => setCueDeckA(!cueDeckA)}
                onToggleCueB={() => setCueDeckB(!cueDeckB)}
              />
            </div>

            {/* DECK B CONTROLLER (5 COLS) */}
            <div className="xl:col-span-5">
              <DeckController
                deck={deckB}
                otherDeck={deckA}
                onPlayPause={handlePlayPauseB}
                onCue={handleCueB}
                onSetCuePoint={handleSetCuePointB}
                onHotCue={handleHotCueB}
                onClearHotCue={handleClearHotCueB}
                onSetLoop={handleSetLoopB}
                onToggleLoop={handleToggleLoopB}
                onHalveLoop={handleHalveLoopB}
                onDoubleLoop={handleDoubleLoopB}
                onPitchChange={handlePitchChangeB}
                onSync={handleSyncB}
                onTapBpm={handleTapBpmB}
                onNudge={handleNudgeB}
                onScrub={handleScrubB}
                onVolumeChange={(vol) => setDeckB((prev) => ({ ...prev, volume: vol }))}
                onHighEqChange={(val) => setDeckB((prev) => ({ ...prev, highEq: val }))}
                onMidEqChange={(val) => setDeckB((prev) => ({ ...prev, midEq: val }))}
                onLowEqChange={(val) => setDeckB((prev) => ({ ...prev, lowEq: val }))}
                onFilterChange={(val) => setDeckB((prev) => ({ ...prev, filter: val }))}
                onToggleHighKill={() => setDeckB((prev) => ({ ...prev, highKill: !prev.highKill }))}
                onToggleMidKill={() => setDeckB((prev) => ({ ...prev, midKill: !prev.midKill }))}
                onToggleLowKill={() => setDeckB((prev) => ({ ...prev, lowKill: !prev.lowKill }))}
                onToggleHeadphoneCue={() => setCueDeckB(!cueDeckB)}
                isHeadphoneCue={cueDeckB}
                onLoadCustomTrack={() => setSingleLoadDeck('B')}
                onSpinback={handleSpinbackB}
              />
            </div>
          </div>
        </section>

        {/* 8-PAD DJ PERFORMANCE FX SAMPLER */}
        <section>
          <SamplerPads onLogEvent={(desc) => logMixEvent(desc, 'MIXER')} />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-400">
        <p>DJ YouTube Mashup Studio · Real-time dual video mixing, pitch sync, and tactile vinyl scratching.</p>
      </footer>

      {/* Modals */}
      <MashupPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
        onLoadCustomPair={handleLoadCustomPair}
      />

      <SingleTrackLoaderModal
        isOpen={singleLoadDeck !== null}
        deckId={singleLoadDeck || 'A'}
        currentTitle={singleLoadDeck === 'A' ? deckA.title : deckB.title}
        onClose={() => setSingleLoadDeck(null)}
        onLoadTrack={handleLoadSingleTrack}
        onOpenDownloader={() => setIsDownloaderOpen(true)}
      />

      <SessionRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        isRecording={isRecording}
        onToggleRecording={() => {
          if (!isRecording) {
            sessionStartTimeRef.current = Date.now();
            setIsRecording(true);
            logMixEvent('Mix session recording started', 'MIXER');
          } else {
            setIsRecording(false);
            logMixEvent('Mix session recording stopped', 'MIXER');
          }
        }}
        events={sessionEvents}
        sessionDuration={sessionDuration}
        onClearEvents={() => {
          setSessionEvents([]);
          setSessionDuration(0);
          sessionStartTimeRef.current = null;
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* ytDownloader Direct Stream Grabber & Format Inspector Modal */}
      <YtDownloaderModal
        isOpen={isDownloaderOpen}
        onClose={() => setIsDownloaderOpen(false)}
        onLoadToDeck={handleLoadFromDownloader}
      />
    </div>
  );
}
