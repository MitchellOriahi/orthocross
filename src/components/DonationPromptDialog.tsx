import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DonationDialog } from "./DonationDialog";
import { supabase } from "@/integrations/supabase/client";

export const DonationPromptDialog = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkShouldShowPrompt = async () => {
      // Check if they're a monthly donor - never show prompt
      const isMonthlyDonor = localStorage.getItem(`monthly_donor_${user.id}`);
      if (isMonthlyDonor) {
        // Verify with backend that they still have an active subscription
        try {
          const { data } = await supabase.functions.invoke("check-monthly-donation");
          if (data?.hasActiveMonthlyDonation) {
            return false;
          } else {
            // No longer a monthly donor, remove the flag
            localStorage.removeItem(`monthly_donor_${user.id}`);
          }
        } catch (error) {
          // If check fails, assume they're still a donor
          return false;
        }
      }

      // Check if they made a one-time donation in the last month
      const lastOneTimeDonation = localStorage.getItem(`last_one_time_donation_${user.id}`);
      if (lastOneTimeDonation) {
        const lastDonationDate = new Date(lastOneTimeDonation);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        if (lastDonationDate > oneMonthAgo) {
          return false;
        }
      }

      // Only show on Sundays
      const today = new Date();
      if (today.getDay() !== 0) {
        return false;
      }

      // Only show once per Sunday
      const todayKey = today.toISOString().slice(0, 10);
      const lastPromptShown = localStorage.getItem(`donation_prompt_shown_${user.id}`);
      if (lastPromptShown) {
        const lastShownKey = new Date(lastPromptShown).toISOString().slice(0, 10);
        if (lastShownKey === todayKey) {
          return false;
        }
      }

      return true;
    };

    const checkAndShow = async () => {
      const shouldShow = await checkShouldShowPrompt();
      if (shouldShow) {
        // Mark that we're showing the prompt now
        localStorage.setItem(`donation_prompt_shown_${user.id}`, new Date().toISOString());
        // Small delay to ensure app is fully loaded
        setTimeout(() => {
          setShowPrompt(true);
        }, 1500);
      }
    };

    checkAndShow();
  }, [user]);

  const handleDismiss = () => {
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
              Acts 20:35 - "It is more blessed to give than to receive."
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
