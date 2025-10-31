import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAudioContext } from '@/contexts/AudioContext';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    };
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
      const audioUrl = URL.createObjectURL(blob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setCurrentAudio(audio);

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        toast({
          variant: 'destructive',
          title: 'Playback Error',
          description: 'Failed to play audio',
        });
      };

      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      toast({
        variant: 'destructive',
        title: 'Text-to-Speech Error',
        description: error.message || 'Failed to generate speech',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, stopAll, setCurrentAudio]);

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
  }, [setCurrentAudio]);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isLoading,
  };
};
