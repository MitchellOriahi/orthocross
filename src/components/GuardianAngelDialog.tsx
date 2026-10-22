import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles } from "lucide-react";

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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-100 to-white flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-yellow-600" />
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
                <p className="text-lg">
                  Your guardian angel couldn't save your streak this time.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your streak has been reset to 0. Start building it back up today!
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-semibold">Next Save Chance:</span>{" "}
                    {remainingPercentage}%
                  </p>
                </div>
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
