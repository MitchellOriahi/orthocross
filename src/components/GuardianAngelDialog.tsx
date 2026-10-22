import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

const StreakMascotFlame = ({ saved }: { saved: boolean }) => (
  <div className="streak-mascot-stage flex w-full items-center justify-center" aria-hidden="true">
    <div className="streak-mascot relative flex h-32 w-32 items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full blur-xl opacity-50 ${saved ? "animate-glow-pulse dark:hidden" : ""}`}
        style={{
          background: saved
            ? "linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd700 100%)"
            : "linear-gradient(135deg, hsl(var(--muted-foreground) / 0.3) 0%, hsl(var(--muted) / 0.5) 100%)",
        }}
      />
      <div
        className={`absolute inset-0 rounded-full blur-xl opacity-50 ${saved ? "animate-glow-pulse hidden dark:block" : "hidden"}`}
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)" }}
      />
      {saved ? (
        <>
          <Flame
            className="relative z-10 h-32 w-32 animate-flame-flicker drop-shadow-lg dark:hidden"
            style={{ color: "#ff6b35" }}
            fill="url(#streakMascotFire)"
          />
          <Flame
            className="relative z-10 h-32 w-32 animate-flame-flicker drop-shadow-lg hidden dark:block"
            style={{ color: "#3b82f6" }}
            fill="url(#streakMascotBlue)"
          />
        </>
      ) : (
        <Flame
          className="relative z-10 h-32 w-32 drop-shadow"
          style={{ color: "hsl(var(--muted-foreground))" }}
          fill="url(#streakMascotAsh)"
        />
      )}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="streakMascotFire" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#f7931e" />
            <stop offset="100%" stopColor="#ff6b35" />
          </linearGradient>
          <linearGradient id="streakMascotBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="streakMascotAsh" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground) / 0.75)" />
            <stop offset="60%" stopColor="hsl(var(--muted-foreground) / 0.55)" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground) / 0.4)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

interface GuardianAngelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved: boolean;
  streakDays: number;
  savesCount: number;
  remainingPercentage: number;
}

export const GuardianAngelDialog = ({
  open,
  onOpenChange,
  saved,
  streakDays,
  remainingPercentage,
}: GuardianAngelDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`streak-sticker ${saved ? "streak-sticker-saved" : "streak-sticker-lost"} w-[86vw] max-w-sm max-h-[85dvh] overflow-y-auto rounded-2xl gap-4 p-5 sm:p-6`}>
        <AlertDialogHeader className="items-center space-y-0">
          <AlertDialogTitle className="text-center text-3xl font-bold leading-tight">
            {saved ? "Streak Saved!" : "Streak Lost"}
          </AlertDialogTitle>
          <StreakMascotFlame saved={saved} />
          <AlertDialogDescription asChild>
            <div className="w-full text-center space-y-3 text-muted-foreground">
            {saved ? (
              <>
                <p className="streak-day-count text-2xl font-bold text-foreground">
                  {streakDays} day streak
                </p>
                <p className="text-base leading-snug">
                  Your guardian angel kept watch.<br />
                  Keep the flame alive with today's reading.
                </p>
                {remainingPercentage === 0 && (
                  <p className="text-xs">You've used your last streak save. Read each day to keep your streak.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-serif italic leading-snug text-foreground">
                  <span className="block text-xs font-sans font-semibold not-italic text-muted-foreground mb-2">Proverbs 24:16</span>
                  "For a righteous man may fall seven times and rise again."
                </p>
                <p className="text-sm text-muted-foreground">
                  Not a single chapter or prayer you offered was in vain.
                </p>
                <p className="text-base font-semibold text-foreground">Let us rise anew with the Lord.</p>
              </>
            )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => onOpenChange(false)} className="streak-action w-full h-12 rounded-xl text-base font-bold">
            {saved ? "Continue" : "Rise"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
