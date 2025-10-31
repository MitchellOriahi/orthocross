import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface AudioContextType {
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  stopAll: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [, forceUpdate] = useState({});

  const setCurrentAudio = useCallback((audio: HTMLAudioElement | null) => {
    // Stop any currently playing audio
    if (currentAudioRef.current && currentAudioRef.current !== audio) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    currentAudioRef.current = audio;
    forceUpdate({});
  }, []);

  const stopAll = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
      forceUpdate({});
    }
  }, []);

  return (
    <AudioContext.Provider value={{ currentAudio: currentAudioRef.current, setCurrentAudio, stopAll }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
};
