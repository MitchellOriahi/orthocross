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
import { Heart } from "lucide-react";
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

  const handleClose = () => {
    setStep(nextCancelStep(step, "close"));
    onOpenChange(false);
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
      setStep(nextCancelStep(step, "cancel"));
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
                onClick={handleCancelDonation}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Cancelling..." : "Yes, I Want to Cancel"}
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
