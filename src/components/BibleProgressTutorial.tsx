import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BibleProgressTutorialProps {
  onComplete: () => void;
}

export const BibleProgressTutorial = ({ onComplete }: BibleProgressTutorialProps) => {
  const [canDismiss, setCanDismiss] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 7000);

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
      
      {/* Spotlight effect on the i button area */}
      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 blur-xl animate-pulse" />
      
      {/* Tutorial card */}
      <Card className="relative z-10 max-w-md mx-4 shadow-2xl border-2 border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Mark Chapters as Read
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Notice the <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary mx-1">
              <Info className="w-3 h-3" />
            </span> button next to your Bible progress meter? That's your quick access tool for tracking your reading journey.
          </p>
          
          <div className="p-4 bg-accent/50 rounded-lg border border-border">
            <p className="text-sm font-medium mb-2">Already reading the Bible elsewhere?</p>
            <p className="text-sm text-muted-foreground">
              No worries! Use the grid inside to quickly mark chapters you've already completed. 
              Tap any book, then tap the chapters you've read. It's that simple to sync your progress 
              and make this app feel like home.
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
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
