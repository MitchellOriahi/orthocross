import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface GuardianAngelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved: boolean;
  streakDays: number;
  savesCount: number;
  /** 100 while this month's grace is still available, 0 once used. */
  remainingPercentage: number;
}

export const GuardianAngelDialog = ({ open, onOpenChange, saved, streakDays }: GuardianAngelDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm text-center">
        <AlertDialogHeader className="items-center space-y-3">
          <AlertDialogTitle className="text-center text-2xl">
            {saved ? "Streak Saved" : "Streak Lost :("}
          </AlertDialogTitle>
          <div className="relative flex justify-center py-2">
            <div className={`absolute inset-0 m-auto h-24 w-24 rounded-full blur-2xl ${saved ? "bg-[hsl(var(--streak-saved-glow)/0.45)]" : "bg-white/40"}`} />
            <div className={`relative flex h-24 w-24 items-center justify-center rounded-full ring-2 shadow-lg ${saved ? "bg-[hsl(var(--streak-saved-glow)/0.22)] ring-[hsl(var(--streak-saved-glow)/0.55)]" : "bg-gradient-to-br from-muted to-muted/40 ring-white/30"}`}>
              <span role="img" aria-label={saved ? "Angel wing" : "Bandaged heart"} className="text-5xl leading-none">
                {saved ? "\u{1FABD}" : "\u{2764}\u{FE0F}\u{200D}\u{1FA79}"}
              </span>
            </div>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-center">
              {saved ? (
                <>
                  <p className="text-base text-foreground">
                    Your guardian angel kept watch over your{" "}
                    <span className="font-bold text-primary">{streakDays}-day streak</span>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    He spent a lot of energy saving your streak.
                    <br />
                    Read and pray every day to awaken him again next month.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Micah 7:8</p>
                  <p className="text-base italic text-foreground">
                    "Though I have fallen, I will rise."
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Not a single chapter or prayer was in vain.
                    <br />
                    Let us rise anew.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className={`w-full size-lg ${saved ? "" : "shadow-[0_0_30px_rgba(255,255,255,0.55)] animate-glow-pulse"}`}
          >
            {saved ? "Continue" : "Arise"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
