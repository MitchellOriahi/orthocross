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
import { Heart, Pause, XCircle } from "lucide-react";

type CancelStep = "confirm" | "pause-offer" | "final";

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
      // Send thank you email
      await supabase.functions.invoke("send-cancellation-email");
      
      // Open customer portal to cancel
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Opening subscription portal. Thank you for your support!");
      }
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to process cancellation");
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
                onClick={() => setStep("final")}
                disabled={isLoading}
                className="w-full"
              >
                No, I Still Want to Cancel
              </Button>
            </div>
          </>
        );

      case "final":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                We're sad to see you go
              </DialogTitle>
              <DialogDescription>
                Thank you so much for your generous support. Your donations have truly made a difference. We'll send you a thank you email shortly.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Wait, I Changed My Mind
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelDonation}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Confirm Cancellation"}
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
