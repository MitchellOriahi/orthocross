import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MascotCompanion } from "@/components/MascotCompanion";
import { StreakFlame } from "./StreakFlame";
import { Button } from "@/components/ui/button";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
  isNewStreak: boolean;
  saintName?: string;
  saintIcon?: string;
  saintPrefix?: string;
}

export const CongratulationsModal = ({
  isOpen,
  onClose,
  streakDays,
  isNewStreak,
  saintName,
  saintIcon,
  saintPrefix
}: CongratulationsModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Reading Complete</DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6">
          {/* Animated mascot / saint reward */}
          <div className="relative grid place-items-center">
            {saintIcon ? (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-soft-pulse" />
                <img 
                  src={saintIcon} 
                  alt={`${saintPrefix} ${saintName}`}
                  className="relative z-10 h-32 w-32 rounded-full object-cover shadow-elevated animate-mascot-cheer"
                />
              </div>
            ) : (
              <MascotCompanion
                mood="cheering"
                size="lg"
                compact
              />
            )}
            {showConfetti && (
              <div className="pointer-events-none absolute -inset-16 overflow-hidden">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${10 + ((i * 37) % 80)}%`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Congratulations Message */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Congratulations!
            </h2>
            <p className="text-lg text-muted-foreground">
              {saintName 
                ? `You've learned about ${saintPrefix} ${saintName}!`
                : isNewStreak 
                  ? "You've completed today's reading!"
                  : "Reading completed!"}
            </p>
          </div>

          {/* Streak Display */}
          {isNewStreak && (
            <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-gradient-peaceful">
              <StreakFlame days={streakDays} size="md" />
              <p className="text-sm text-center text-muted-foreground">
                Keep up your daily reading to grow your streak!
              </p>
            </div>
          )}

          {/* Close Button */}
          <Button 
            variant="sacred" 
            size="lg" 
            onClick={onClose}
            className="duo-button w-full rounded-2xl font-bold shadow-elevated"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
