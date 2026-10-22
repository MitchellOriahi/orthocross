import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Feather, Flame, Sparkles } from "lucide-react";

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
  savesCount,
  remainingPercentage,
}: GuardianAngelDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[86vw] max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3">
            {saved ? (
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 via-amber-200 to-yellow-100 flex items-center justify-center shadow-lg shadow-orange-400/40">
                <Flame className="w-11 h-11 text-orange-500 fill-orange-400" />
                <Feather className="absolute -right-1 -bottom-1 w-8 h-8 p-1.5 rounded-full bg-sky-100 text-sky-600 shadow" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center shadow-inner">
                <Flame className="w-11 h-11 text-muted-foreground/60 fill-muted-foreground/20" />
              </div>
            )}
          </div>

          <AlertDialogTitle className="text-center text-2xl">
            {saved ? (
              <>
                <Sparkles className="inline w-6 h-6 text-yellow-500 mr-2" />
                Guardian Angel Saved You!
                <Sparkles className="inline w-6 h-6 text-yellow-500 ml-2" />
              </>
            ) : (
              "Streak Lost"
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4 pt-4">
            {saved ? (
              <>
                <p className="text-lg">
                  Your guardian angel intervened and saved your{" "}
                  <span className="font-bold text-primary">{streakDays} day streak</span>!
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Total Saves:</span> {savesCount}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Next Save Chance:</span>{" "}
                    {remainingPercentage}%
                  </p>
                  {remainingPercentage === 0 && (
                    <p className="text-xs text-destructive font-medium">
                      Your guardian angel can no longer save your streak!
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Remember to complete your daily activities to maintain your streak!
                </p>
              </>
            ) : (
              <>
                <p className="text-base italic">
                  <span className="block text-xs not-italic text-muted-foreground mb-1">Proverbs 24:16</span>
                  "For a righteous man may fall seven times and rise again."
                </p>
                <p className="text-sm text-muted-foreground">
                  Not a single chapter or prayer you offered was in vain.
                </p>
                <p className="text-base font-semibold">Let us rise anew with the Lord.</p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {saved ? "Continue" : "Rise"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
