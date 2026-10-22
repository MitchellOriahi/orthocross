import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Sunrise } from "lucide-react";

interface GuardianAngelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved: boolean;
  streakDays: number;
  savesCount: number;
  /** 100 while this month's grace is still available, 0 once used. */
  remainingPercentage: number;
}

const GRACE_STREAK_DAYS = 7;

export const GuardianAngelDialog = ({ open, onOpenChange, saved, streakDays }: GuardianAngelDialogProps) => {
  const month = new Date().toLocaleDateString(undefined, { month: "long" });
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm text-center">
        <AlertDialogHeader className="items-center space-y-3">
          <AlertDialogTitle className="text-center text-2xl">
            {saved ? "Streak Saved" : "Streak Lost"}
          </AlertDialogTitle>
          <div className="relative flex justify-center py-2">
            <div className={`absolute inset-0 m-auto h-24 w-24 rounded-full blur-2xl ${saved ? "bg-primary/40" : "bg-muted-foreground/20"}`} />
            <div className={`relative flex h-24 w-24 items-center justify-center rounded-full ring-2 shadow-lg ${saved ? "bg-gradient-to-br from-primary/30 to-primary/5 ring-primary/50" : "bg-gradient-to-br from-muted to-muted/40 ring-border"}`}>
              {saved ? (
                <ShieldCheck className="h-12 w-12 text-primary" strokeWidth={1.75} />
              ) : (
                <Sunrise className="h-12 w-12 text-muted-foreground" strokeWidth={1.75} />
              )}
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
                    {month}'s grace has been used. Keep reading daily to earn it again next month.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proverbs 24:16</p>
                  <p className="text-base italic text-foreground">
                    "For a righteous man may fall seven times and rise again."
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Not a single chapter or prayer you offered was in vain. Let us rise anew with the Lord.
                  </p>
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>Reach a {GRACE_STREAK_DAYS}-day streak to earn your guardian angel's monthly save.</span>
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            {saved ? "Continue" : "Rise"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
