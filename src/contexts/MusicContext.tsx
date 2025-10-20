import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';

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
    // Listen for app state changes
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && audioRef.current) {
        // App went to background - pause music
        audioRef.current.pause();
      }
    });

    return () => {
      listener.then(l => l.remove());
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
    const soundMap = {
      chapter: '/sounds/chapter-complete.mp3',
      book: '/sounds/book-complete.mp3',
      island: '/sounds/island-complete.mp3',
      saint: '/sounds/saint-complete.mp3',
    };

    const audio = new Audio(soundMap[soundType]);
    audio.volume = sfxVolume;
    audio.play().catch(e => console.log('Sound play failed:', e));
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
