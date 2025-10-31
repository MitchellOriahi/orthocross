import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAudioContext } from '@/contexts/AudioContext';

// Simple in-memory cache for audio
const audioCache = new Map<string, string>();

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { setCurrentAudio, stopAll } = useAudioContext();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
      }
    };
  }, []);

  const startWordHighlighting = useCallback((text: string, duration: number) => {
    const textWords = text.split(/\s+/).filter(w => w.length > 0);
    setWords(textWords);
    setCurrentWordIndex(0);
    
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
    }
    
    const timePerWord = (duration * 1000) / textWords.length;
    let index = 0;
    
    wordTimerRef.current = setInterval(() => {
      index++;
      if (index >= textWords.length) {
        setCurrentWordIndex(-1);
        if (wordTimerRef.current) clearInterval(wordTimerRef.current);
      } else {
        setCurrentWordIndex(index);
      }
    }, timePerWord);
  }, []);

  const speak = useCallback(async (text: string, voice: string = 'alloy') => {
    try {
      setIsLoading(true);
      
      // Stop all other audio globally
      stopAll();
      
      // Stop any currently playing audio in this instance
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
        setCurrentWordIndex(-1);
      }

      // Check cache first
      const cacheKey = `${text}-${voice}`;
      let audioUrl = audioCache.get(cacheKey);
      let audioDuration = 0;

      if (!audioUrl) {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text, voice }
        });

        if (error) throw error;

        if (!data?.audioContent) {
          throw new Error('No audio content received');
        }

        // Convert base64 to blob
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
        
        // Cache for future use (limit cache size)
        if (audioCache.size > 20) {
          const firstKey = audioCache.keys().next().value;
          const oldUrl = audioCache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, audioUrl);
      }

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setCurrentAudio(audio);

      audio.onloadedmetadata = () => {
        audioDuration = audio.duration;
        startWordHighlighting(text, audioDuration);
      };

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => {
        setIsPlaying(false);
        if (wordTimerRef.current) {
          clearInterval(wordTimerRef.current);
        }
      };
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        setCurrentWordIndex(-1);
        if (wordTimerRef.current) {
          clearInterval(wordTimerRef.current);
        }
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        setCurrentWordIndex(-1);
        toast({
          variant: 'destructive',
          title: 'Playback Error',
          description: 'Failed to play audio',
        });
      };

      setIsLoading(false);
      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      toast({
        variant: 'destructive',
        title: 'Text-to-Speech Error',
        description: error.message || 'Failed to generate speech',
      });
      setIsLoading(false);
    }
  }, [toast, stopAll, setCurrentAudio, startWordHighlighting]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
    }
    setCurrentWordIndex(-1);
  }, [setCurrentAudio]);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isLoading,
    currentWordIndex,
    words,
  };
};
