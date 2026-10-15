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
import { toast } from "sonner";
import { Heart, Pause } from "lucide-react";

type CancelStep = "confirm" | "pause-offer" | "thanks";

interface CancelDonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CancelDonationDialog = ({ open, onOpenChange }: CancelDonationDialogProps) => {
  const [step, setStep] = useState<CancelStep>("confirm");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep("confirm");
    onOpenChange(false);
  };

  const handlePauseDonation = async (months: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success(`Opening subscription portal to pause for ${months} month${months > 1 ? 's' : ''}`);
      }
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to open subscription management");
    } finally {
      setIsLoading(false);
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
      setStep("thanks");
    } catch (error: any) {
      toast.error(error.message || "We couldn't cancel your donation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
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
                onClick={() => setStep("pause-offer")}
                className="w-full"
              >
                Yes, I Want to Cancel
              </Button>
            </div>
          </>
        );

      case "pause-offer":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pause className="w-5 h-5" />
                Would you like to pause instead?
              </DialogTitle>
              <DialogDescription>
                Instead of canceling, you can pause your donations for 1-3 months. Your subscription will automatically resume after the pause period.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => handlePauseDonation(1)}
                disabled={isLoading}
                className="w-full"
              >
                Pause for 1 Month
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePauseDonation(2)}
                disabled={isLoading}
                className="w-full"
              >
                Pause for 2 Months
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePauseDonation(3)}
                disabled={isLoading}
                className="w-full"
              >
                Pause for 3 Months
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelDonation}
                disabled={isLoading}
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
