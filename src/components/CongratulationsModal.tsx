import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DoveMascot } from "./DoveMascot";
import { StreakFlame } from "./StreakFlame";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import orthodoxCrossBlack from "@/assets/orthodox-cross-black-new.png";
import orthodoxCrossWhite from "@/assets/orthodox-cross-white-new.png";
import { SaintCardIcon } from "@/components/resources/SaintCardIcon";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
  isNewStreak: boolean;
  saintName?: string;
  saintIcon?: string;
  saintPrefix?: string;
  allSaintStories?: boolean;
  saintId?: string;
}

export const CongratulationsModal = ({
  isOpen,
  onClose,
  streakDays,
  isNewStreak,
  saintName,
  saintIcon,
  saintPrefix,
  allSaintStories = false,
  saintId
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
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent 
        className={`z-[100] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto${allSaintStories || saintId ? " saint-collection-award" : ""}`}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{allSaintStories ? "All Saints Stories Complete" : "Reading Complete"}</DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6">
          {/* Animated Cross Logo or Saint Icon */}
          <div className="relative">
            {saintId && !allSaintStories ? (
              <SaintCardIcon saintId={saintId} fallbackUrl={saintIcon} className="!h-36 !w-36 saint-story-completed" />
            ) : saintIcon && !allSaintStories ? (
              <img 
                src={saintIcon} 
                alt={`${saintPrefix} ${saintName}`}
                className="w-32 h-32 rounded-full object-cover shadow-lg"
              />
            ) : (
              <img 
                src={crossLogo} 
                alt="Orthodox Cross"
                className={`w-32 h-32 object-contain${allSaintStories ? "" : " motion-safe:animate-bounce"}`}
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
              {allSaintStories
                ? "You've read every saint's story!"
                : saintName 
                ? `You've completed the story of ${[saintPrefix, saintName].filter(Boolean).join(" ")}!`
                : isNewStreak 
                  ? "You've completed today's reading!"
                  : "Reading completed!"}
            </p>
            {saintId && !allSaintStories && <p className="text-base leading-relaxed text-muted-foreground pt-2">May this saint's faith and love inspire your journey with Christ.</p>}
            {allSaintStories && <>
              <p className="saint-award-title text-sm font-semibold pt-2">A heart inspired by the saints</p>
              <p className="text-base leading-relaxed text-muted-foreground pt-2">One story at a time, you made room in your heart for lives of faith, courage, and love. Your dedication is something beautiful.</p>
              <p className="text-base leading-relaxed text-muted-foreground pt-2">May their example stay with you, bring you hope in difficult moments, and draw you closer to Christ. Congratulations on this wonderful journey.</p>
            </>}
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
