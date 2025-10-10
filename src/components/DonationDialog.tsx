import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationDialog = ({ open, onOpenChange }: DonationDialogProps) => {
  const [amount, setAmount] = useState("5.00");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDonate = async () => {
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    if (isNaN(amountInCents) || amountInCents < 50) {
      toast({
        title: "Invalid amount",
        description: "Please enter a minimum donation of $0.50",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: { amount: amountInCents },
      });

      if (error) throw error;

      // Record donation locally before redirecting
      if (user) {
        const donationDate = new Date().toISOString();
        localStorage.setItem(`last_donation_${user.id}`, donationDate);
      }

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process donation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [5, 10, 25, 50];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support OrthoCross</DialogTitle>
          <DialogDescription>
            Your donation helps us spread the Gospel and maintain this free app for everyone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Donation Amount (USD)</Label>
            <div className="flex gap-2 mb-3">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toFixed(2))}
                  className="flex-1"
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                placeholder="5.00"
              />
            </div>
          </div>

          <Button 
            onClick={handleDonate} 
            disabled={loading}
            className="w-full"
            variant="sacred"
          >
            {loading ? "Processing..." : "Donate Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};