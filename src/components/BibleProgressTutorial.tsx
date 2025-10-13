import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BibleProgressTutorialProps {
  onComplete: () => void;
}

export const BibleProgressTutorial = ({ onComplete }: BibleProgressTutorialProps) => {
  const [canDismiss, setCanDismiss] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [timeProgress, setTimeProgress] = useState(0);

  useEffect(() => {
    const totalTime = 7000; // 7 seconds
    const intervalTime = 50; // Update every 50ms for smooth animation
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      setTimeProgress((currentStep / steps) * 100);
      
      if (currentStep >= steps) {
        clearInterval(progressInterval);
        setCanDismiss(true);
      }
    }, intervalTime);

    return () => clearInterval(progressInterval);
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
            {canDismiss ? "Tap anywhere to continue" : `Please wait ${Math.ceil((100 - timeProgress) / 100 * 7)} seconds...`}
          </p>
          
          {!canDismiss && (
            <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-75 ease-linear" 
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
