import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DoveMascot } from "./DoveMascot";
import { StreakFlame } from "./StreakFlame";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import orthodoxCrossBlack from "@/assets/orthodox-cross-black-new.png";
import orthodoxCrossWhite from "@/assets/orthodox-cross-white-new.png";

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
  const { theme } = useTheme();
  
  const crossLogo = theme === 'dark' ? orthodoxCrossWhite : orthodoxCrossBlack;

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
        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6">
          {/* Animated Cross Logo or Saint Icon */}
          <div className="relative">
            {saintIcon ? (
              <img 
                src={saintIcon} 
                alt={`${saintPrefix} ${saintName}`}
                className="w-32 h-32 rounded-full object-cover shadow-lg"
              />
            ) : (
              <img 
                src={crossLogo} 
                alt="Orthodox Cross"
                className="w-32 h-32 object-contain animate-bounce"
              />
            )}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="absolute text-primary animate-ping"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "1s"
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
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
