import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const DONATION_COMPLETED_EVENT = "orthocross:donation-completed";

export const DonationThankYouDialog = () => {
  const [showThankYou, setShowThankYou] = useState(false);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Native (in-app purchase) donations announce themselves via a window event
  useEffect(() => {
    const onDone = () => setShowThankYou(true);
    window.addEventListener(DONATION_COMPLETED_EVENT, onDone);
    return () => window.removeEventListener(DONATION_COMPLETED_EVENT, onDone);
  }, []);

  // Web (Stripe) donations return with ?donation=...&session_id=...
  useEffect(() => {
    if (!user) return;
    const donationResult = searchParams.get("donation");
    if (donationResult !== "success" && donationResult !== "monthly_success") return;

    const isMonthly = donationResult === "monthly_success";
    const sessionId = searchParams.get("session_id");

    setShowThankYou(true);

    if (sessionId) {
      // Records the donation (Donators list) and sends the thank-you email + message
      supabase.functions.invoke("record-donation", { body: { sessionId } }).catch(console.error);
    }

    const now = new Date().toISOString();
    if (isMonthly) localStorage.setItem(`monthly_donor_${user.id}`, "true");
    else localStorage.setItem(`last_one_time_donation_${user.id}`, now);
    localStorage.setItem(`donation_thank_you_${user.id}`, now);

    searchParams.delete("donation");
    searchParams.delete("session_id");
    setSearchParams(searchParams, { replace: true });
  }, [user, searchParams, setSearchParams]);

  const handleClose = () => setShowThankYou(false);

  return (
    <Dialog open={showThankYou} onOpenChange={handleClose}>
      <DialogContent className="w-[86vw] max-w-sm rounded-2xl border-0 bg-gradient-to-b from-primary/5 to-background">
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
            <span className="block font-semibold text-foreground">Your generosity helps spread the Gospel.</span>
            <span className="block text-primary font-medium mt-2">May God bless you abundantly! 🙏</span>
            <span className="block text-muted-foreground text-sm mt-3">A thank you email and message are on their way to you.</span>
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
