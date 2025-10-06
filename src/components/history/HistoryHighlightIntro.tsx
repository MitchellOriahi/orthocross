import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Highlighter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const HistoryHighlightIntro = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const hasSeenHistoryHighlightIntro = localStorage.getItem("hasSeenHistoryHighlightIntro");
    if (!hasSeenHistoryHighlightIntro) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenHistoryHighlightIntro", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-fade-in">
            <Highlighter className="w-12 h-12 text-primary" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold">
              {isMobile ? "Tap" : "Click"} to Highlight Sentences
            </h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {isMobile ? "Tap" : "Click"} on any sentence to highlight it. Your highlights will be saved.
            </p>
          </div>

          <Button onClick={handleComplete} className="min-w-32">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
