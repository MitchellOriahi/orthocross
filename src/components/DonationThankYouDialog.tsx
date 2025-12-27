import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const DonationThankYouDialog = () => {
  const [showThankYou, setShowThankYou] = useState(false);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;

    const donationResult = searchParams.get("donation");
    
    if (donationResult === "success" || donationResult === "monthly_success") {
      const isMonthly = donationResult === "monthly_success";
      
      // Check if we've already shown thank you for this donation
      const lastThankYou = localStorage.getItem(`donation_thank_you_${user.id}`);
      
      if (lastThankYou) {
        const lastThankYouDate = new Date(lastThankYou);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (lastThankYouDate > oneYearAgo) {
          // Remove the query param without showing dialog
          searchParams.delete("donation");
          setSearchParams(searchParams, { replace: true });
          return;
        }
      }

      // Show thank you dialog
      setShowThankYou(true);
      
      // Send thank you email
      sendThankYouEmail(isMonthly);
      
      // Record the donation date based on type
      const donationDate = new Date().toISOString();
      if (isMonthly) {
        // Mark as monthly donor - permanently suppress prompt
        localStorage.setItem(`monthly_donor_${user.id}`, 'true');
      } else {
        // One-time donation - suppress prompt for 1 month
        localStorage.setItem(`last_one_time_donation_${user.id}`, donationDate);
      }
      localStorage.setItem(`donation_thank_you_${user.id}`, donationDate);
      
      // Remove query param
      searchParams.delete("donation");
      setSearchParams(searchParams, { replace: true });
    }
  }, [user, searchParams, setSearchParams]);

  const sendThankYouEmail = async (isMonthly: boolean) => {
    try {
      await supabase.functions.invoke("send-donation-thank-you", {
        body: { donationType: isMonthly ? "monthly" : "one-time" }
      });
      console.log("Thank you email sent successfully");
    } catch (error) {
      console.error("Failed to send thank you email:", error);
    }
  };

  const handleClose = () => {
    setShowThankYou(false);
  };

  return (
    <Dialog open={showThankYou} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-primary/5 to-background">
        <DialogHeader className="text-center items-center space-y-6 pt-8 pb-6">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center animate-scale-in">
              <Heart className="w-16 h-16 text-primary fill-primary animate-pulse" />
            </div>
            <Sparkles className="w-8 h-8 text-primary absolute -top-2 -right-2 animate-bounce" />
            <Sparkles className="w-6 h-6 text-primary absolute -bottom-1 -left-1 animate-bounce delay-150" />
          </div>
          <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Thank You!
          </DialogTitle>
          <DialogDescription className="text-lg text-center">
            <p className="font-semibold text-foreground">Your generosity helps spread the Gospel.</p>
            <p className="text-primary font-medium mt-2">May God bless you abundantly! 🙏</p>
            <p className="text-muted-foreground text-sm mt-3">A thank you email has been sent to you.</p>
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2 pb-4">
          <Button variant="sacred" onClick={handleClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
