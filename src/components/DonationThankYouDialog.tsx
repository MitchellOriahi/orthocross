import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

export const DonationThankYouDialog = () => {
  const [showThankYou, setShowThankYou] = useState(false);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;

    const donationSuccess = searchParams.get("donation");
    
    if (donationSuccess === "success") {
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
      
      // Record the donation date
      const donationDate = new Date().toISOString();
      localStorage.setItem(`last_donation_${user.id}`, donationDate);
      localStorage.setItem(`donation_thank_you_${user.id}`, donationDate);
      
      // Remove query param
      searchParams.delete("donation");
      setSearchParams(searchParams, { replace: true });
    }
  }, [user, searchParams, setSearchParams]);

  const handleClose = () => {
    setShowThankYou(false);
  };

  return (
    <Dialog open={showThankYou} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center space-y-4 pt-6">
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Heart className="w-10 h-10 text-primary fill-primary" />
            </div>
            <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-bounce" />
          </div>
          <DialogTitle className="text-3xl">Thank You!</DialogTitle>
          <DialogDescription className="text-base space-y-3">
            <p className="font-semibold text-foreground">Your donation means the world to us.</p>
            <p>
              You're helping us spread the Gospel and keep OrthoCross free for everyone. 
              Your generosity is making a real difference in people's spiritual lives.
            </p>
            <p className="text-primary font-medium">May God bless you abundantly! 🙏</p>
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          <Button variant="sacred" onClick={handleClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};