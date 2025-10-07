import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BibleProgressTutorialProps {
  onComplete: () => void;
}

export const BibleProgressTutorial = ({ onComplete }: BibleProgressTutorialProps) => {
  const [canDismiss, setCanDismiss] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (canDismiss) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Darkened overlay */}
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-300"
        onClick={handleDismiss}
      />
      
      {/* Spotlight and arrow pointing to the i button in Bible completion meter */}
      <div className="absolute top-1/3 right-4 w-20 h-20 rounded-full bg-white/20 blur-xl animate-pulse" />
      <div className="absolute top-1/3 right-12 -translate-y-12 text-white animate-bounce">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 17l10-10M17 17V7h-10" />
        </svg>
      </div>
      
      {/* Tutorial card - welcome slide style */}
      <Card className="relative z-10 max-w-md mx-4 shadow-2xl border-none cursor-pointer" onClick={handleDismiss}>
        <CardContent className="pt-12 pb-8 space-y-8 text-center">
          {/* Large centered icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          {/* Simple centered text */}
          <p className="text-lg leading-relaxed px-4">
            Mark chapters you've already read using the <Info className="inline w-5 h-5 text-primary" /> button next to the Bible completion meter if you don't want to start your Bible journey from scratch.
          </p>

          <p className="text-xs text-muted-foreground">
            {canDismiss ? "Tap anywhere to continue" : "Please wait a moment..."}
          </p>
          
          {!canDismiss && (
            <div className="w-full bg-accent rounded-full h-1 overflow-hidden">
              <div className="h-full bg-primary animate-progress-bar" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
