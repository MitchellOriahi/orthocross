import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

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
          <div className="streak-mascot-stage flex w-full items-center justify-center" aria-hidden="true">
            <img
              src={saved ? savedFlame : lostFlame}
              alt=""
              width={1024}
              height={1024}
              className="streak-mascot h-full w-full object-contain"
            />
          </div>
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
