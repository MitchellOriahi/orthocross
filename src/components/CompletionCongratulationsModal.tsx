import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";
import { MascotCompanion } from "@/components/MascotCompanion";

interface CompletionCongratulationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
}

export function CompletionCongratulationsModal({ 
  open, 
  onOpenChange, 
  onReset 
}: CompletionCongratulationsModalProps) {
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    if (open) {
      setCanClose(false);
      // Allow closing after 3 seconds
      const timer = setTimeout(() => {
        setCanClose(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    if (canClose) {
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : () => {}}>
      <DialogContent 
        className="max-w-2xl"
        onPointerDownOutside={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">100% Completion Achievement</DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Animated Trophy + mascot */}
          <div className="relative flex items-center justify-center gap-2">
            <MascotCompanion mood="cheering" size="md" compact />
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-50 blur-3xl animate-soft-pulse" />
              <Trophy className="relative z-10 h-28 w-28 text-yellow-500 animate-mascot-cheer" />
              <Sparkles className="absolute -right-2 -top-2 h-10 w-10 text-yellow-400 animate-reward-pop" />
              <Sparkles className="absolute -bottom-1 -left-1 h-7 w-7 text-orange-400 animate-reward-pop" style={{ animationDelay: '180ms' }} />
            </div>
          </div>

          {/* Congratulations Text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent animate-fade-in">
              🎉 CONGRATULATIONS! 🎉
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-foreground">
              You've achieved 100% completion!
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                ✅ Completed the entire Bible
              </p>
              <p className="flex items-center justify-center gap-2">
                ✅ Finished all Orthodox History islands
              </p>
              <p className="flex items-center justify-center gap-2">
                ✅ Read about all the Saints
              </p>
            </div>
          </div>

          {/* Timer indicator */}
          {!canClose && (
            <p className="text-sm text-muted-foreground animate-pulse">
              This moment deserves to be celebrated...
            </p>
          )}

          {/* Action Buttons */}
          {canClose && (
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-4">
              <Button
                onClick={handleClose}
                variant="outline"
                className="duo-button flex-1 rounded-2xl font-bold"
              >
                Continue
              </Button>
              <Button
                onClick={handleReset}
                variant="default"
                className="duo-button flex-1 rounded-2xl font-bold"
              >
                Reset Progress & Start Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
