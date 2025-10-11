import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DonationDialog } from "./DonationDialog";

export const DonationPromptDialog = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkShouldShowPrompt = () => {
      const lastDonation = localStorage.getItem(`last_donation_${user.id}`);
      const promptDismissed = localStorage.getItem(`donation_prompt_dismissed_${user.id}`);

      if (lastDonation) {
        const lastDonationDate = new Date(lastDonation);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (lastDonationDate > oneYearAgo) {
          return false;
        }
      }

      if (promptDismissed) {
        const dismissedDate = new Date(promptDismissed);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (dismissedDate > sevenDaysAgo) {
          return false;
        }
      }

      return true;
    };

    if (checkShouldShowPrompt()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`donation_prompt_dismissed_${user.id}`, new Date().toISOString());
    }
    setShowPrompt(false);
  };

  const handleDonate = () => {
    setShowPrompt(false);
    setShowDonation(true);
  };

  return (
    <>
      <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader className="text-center items-center space-y-4 pt-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Support OrthoCross</DialogTitle>
            <DialogDescription className="text-base">
              Help an independent developer spread the Gospel to as many people as possible. Every contribution helps reach more souls.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleDismiss} className="flex-1">
              Maybe Later
            </Button>
            <Button variant="sacred" onClick={handleDonate} className="flex-1">
              Donate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DonationDialog open={showDonation} onOpenChange={setShowDonation} />
    </>
  );
};