import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  sfxVolume: number;
  setSfxVolume: (volume: number) => void;
  playSound: (soundType: 'chapter' | 'book' | 'island' | 'saint') => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem('musicEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? parseFloat(saved) : 0.2;
  });

  const [sfxVolume, setSfxVolumeState] = useState(() => {
    const saved = localStorage.getItem('sfxVolume');
    return saved ? parseFloat(saved) : 0.5;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    // Create audio element - Calm atmospheric ambient music for study/meditation (no vocals, no beats)
    audioRef.current = new Audio('https://assets.mixkit.co/music/127/127.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    audioRef.current.crossOrigin = "anonymous";

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      } else {
        audioRef.current.pause();
      }
    }
    localStorage.setItem('musicEnabled', JSON.stringify(isPlaying));
  }, [isPlaying]);

  useEffect(() => {
    // Pause on background, resume on foreground. iOS suspends audio on
    // background and never un-suspends it for us, so both directions are
    // handled explicitly, reading current state through refs (this effect
    // registers its listeners exactly once).
    const pauseAudio = () => {
      audioRef.current?.pause();
    };
    const resumeAudio = () => {
      sfxCtxRef.current?.resume().catch(() => {});
      if (isPlayingRef.current && audioRef.current) {
        audioRef.current.volume = volumeRef.current;
        audioRef.current.play().catch(e => console.log('Audio resume failed:', e));
      }
    };

    let cancelled = false;
    let capacitorCleanup: (() => void) | undefined;
    let usingNativeListener = false;

    const handleVisibilityChange = () => {
      if (usingNativeListener) return; // native appStateChange owns lifecycle
      if (document.hidden) pauseAudio();
      else resumeAudio();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          const listener = await App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) resumeAudio();
            else pauseAudio();
          });
          if (cancelled) {
            listener.remove();
          } else {
            usingNativeListener = true;
            capacitorCleanup = () => listener.remove();
          }
        }
      } catch (e) {
        // Capacitor not available, ignore
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      capacitorCleanup?.();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    localStorage.setItem('musicVolume', volume.toString());
  }, [volume]);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const setSfxVolume = (newVolume: number) => {
    setSfxVolumeState(newVolume);
    localStorage.setItem('sfxVolume', newVolume.toString());
  };

  const playSound = (soundType: 'chapter' | 'book' | 'island' | 'saint') => {
    // Using different sound frequencies for church bell effects.
    // One shared AudioContext for the whole session: WebKit caps live
    // contexts (~4), so creating one per sound silences SFX permanently
    // after a few plays. Resume it in case iOS suspended it on background.
    if (!sfxCtxRef.current) {
      sfxCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = sfxCtxRef.current;
    audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different bell tones for different completions
    const soundConfig = {
      chapter: { freq: 523.25, duration: 0.3 }, // C5 - single bell
      book: { freq: 659.25, duration: 0.5 }, // E5 - higher chime
      island: { freq: 783.99, duration: 0.7 }, // G5 - celebration
      saint: { freq: 440.00, duration: 0.4 }, // A4 - reverent
    };
    
    const config = soundConfig[soundType];
    oscillator.frequency.setValueAtTime(config.freq, audioContext.currentTime);
    oscillator.type = 'sine'; // Bell-like tone
    
    // Volume envelope for natural bell sound
    gainNode.gain.setValueAtTime(sfxVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  };

  return (
    <MusicContext.Provider value={{ isPlaying, toggleMusic, volume, setVolume, sfxVolume, setSfxVolume, playSound }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
