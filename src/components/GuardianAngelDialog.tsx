import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Feather, Sunrise, Sparkles } from "lucide-react";

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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-100 to-white flex items-center justify-center shadow-lg">
              {saved ? <Feather className="w-8 h-8 text-yellow-600" /> : <Sunrise className="w-8 h-8 text-yellow-600" />}
            </div>
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
                  "For a righteous man may fall seven times and rise again."
                  <span className="block text-xs not-italic text-muted-foreground mt-1">Proverbs 24:16</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Like the prodigal son, we are always welcomed home. Not a single chapter or prayer you offered was in vain.
                </p>
                <p className="text-base font-semibold">Let us rise anew with the Lord.</p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
