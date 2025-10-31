import { Volume2, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface TextToSpeechWithHighlightProps {
  text: string;
  voice?: string;
  className?: string;
}

export const TextToSpeechWithHighlight = ({ 
  text, 
  voice = 'alloy',
  className = '' 
}: TextToSpeechWithHighlightProps) => {
  const { speak, pause, isPlaying, isLoading, currentWordIndex, words } = useTextToSpeech();

  const handleToggle = () => {
    if (isPlaying) {
      pause();
    } else if (isLoading) {
      return;
    } else {
      speak(text, voice);
    }
  };

  const renderTextWithHighlight = () => {
    if (words.length === 0 || currentWordIndex === -1) {
      return <span>{text}</span>;
    }

    return (
      <span>
        {words.map((word, index) => (
          <span
            key={index}
            className={
              index === currentWordIndex
                ? 'bg-primary/30 dark:bg-primary/40 transition-colors duration-100 rounded px-0.5'
                : ''
            }
          >
            {word}{' '}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isLoading}
        className="h-8 w-8 flex-shrink-0 mt-0.5"
        title={isPlaying ? 'Pause reading' : 'Read aloud'}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1 leading-relaxed">
        {renderTextWithHighlight()}
      </div>
    </div>
  );
};
