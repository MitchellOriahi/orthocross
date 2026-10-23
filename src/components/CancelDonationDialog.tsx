import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { Heart, Pause } from "lucide-react";
import {
  INITIAL_CANCEL_STEP,
  nextCancelStep,
  type CancelStep,
} from "@/lib/donationCancellation";

interface CancelDonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CancelDonationDialog = ({ open, onOpenChange }: CancelDonationDialogProps) => {
  const [step, setStep] = useState<CancelStep>(INITIAL_CANCEL_STEP);
  const [isLoading, setIsLoading] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const handleClose = () => {
    setStep(nextCancelStep(step, "close"));
    onOpenChange(false);
  };

  const handlePause = async () => {
    setIsPausing(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json?.())?.error; } catch { /* ignore */ }
        throw new Error(msg || "We couldn't open the pause page. Please try again.");
      }
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        handleClose();
      } else {
        throw new Error("We couldn't open the pause page. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "We couldn't open the pause page. Please try again.");
    } finally {
      setIsPausing(false);
    }
  };

  const handleCancelDonation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-monthly-donation");
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json?.())?.error; } catch { /* ignore */ }
        throw new Error(msg || "We couldn't cancel your donation. Please try again.");
      }
      supabase.functions.invoke("send-cancellation-email").catch(() => {});
      window.dispatchEvent(new Event("monthly-donation-changed"));
      setStep(nextCancelStep(step, "cancel_final"));
    } catch (error: any) {
      toast.error(error.message || "We couldn't cancel your donation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    // Monthly donations are web-only (Stripe); the app never links out to manage them.
    if (Capacitor.isNativePlatform()) {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Monthly donations
            </DialogTitle>
            <DialogDescription>
              Monthly donations are managed on the OrthoCross website. Thank you for your support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </>
      );
    }

    switch (step) {
      case "confirm":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Are you sure?
              </DialogTitle>
              <DialogDescription>
                Your monthly donations help keep OrthoCross running and support the development of new features. Are you sure you want to cancel?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                No, Keep My Donation
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(nextCancelStep(step, "cancel"))}
                className="w-full"
              >
                Yes, I Want to Cancel
              </Button>
            </div>
          </>
        );

      case "pause":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pause className="w-5 h-5" />
                Would you like to pause instead?
              </DialogTitle>
              <DialogDescription>
                You can pause your monthly donation for a while and pick it back up whenever you're ready — every gift, big or small, means the world to us.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={isPausing || isLoading}
                className="w-full"
              >
                Pause for 1 Month
              </Button>
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={isPausing || isLoading}
                className="w-full"
              >
                Pause for 2 Months
              </Button>
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={isPausing || isLoading}
                className="w-full"
              >
                Pause for 3 Months
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelDonation}
                disabled={isLoading || isPausing}
                className="w-full"
              >
                {isLoading ? "Cancelling..." : "No, I Still Want to Cancel"}
              </Button>
            </div>
          </>
        );

      case "thanks":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Thank you, from all of us
              </DialogTitle>
              <DialogDescription>
                Your monthly donation has been cancelled. Every gift you gave helped bring prayers, saints and Scripture to people around the world. We are deeply grateful for your generosity. May God continue to bless you.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
