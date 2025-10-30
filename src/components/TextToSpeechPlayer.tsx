import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface TextToSpeechPlayerProps {
  text: string;
  voice?: string;
}

export const TextToSpeechPlayer = ({ text, voice = 'alloy' }: TextToSpeechPlayerProps) => {
  const { speak, stop, isPlaying, isLoading } = useTextToSpeech();

  const handleToggle = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(text, voice);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className="h-8 w-8"
      title={isPlaying ? 'Stop reading' : 'Read aloud'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};
