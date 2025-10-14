import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isIAPAvailable, purchaseDonation, getProductIdForAmount, restorePurchases } from "@/utils/inAppPurchases";
import { RefreshCw } from "lucide-react";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationDialog = ({ open, onOpenChange }: DonationDialogProps) => {
  const [amount, setAmount] = useState("5.00");
  const [loading, setLoading] = useState(false);
  const [useIAP, setUseIAP] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if IAP is available when dialog opens
    setUseIAP(isIAPAvailable());
  }, [open]);

  const handleDonate = async () => {
    const amountValue = parseFloat(amount);
    
    if (isNaN(amountValue) || amountValue < 0.50) {
      toast({
        title: "Invalid amount",
        description: "Please enter a minimum donation of $0.50",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Use IAP for iOS native app
      if (useIAP) {
        const productId = getProductIdForAmount(Math.round(amountValue));
        
        if (!productId) {
          toast({
            title: "Amount not available",
            description: "Please select a preset amount for in-app purchase",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const result = await purchaseDonation(productId);
        
        if (result.success) {
          // Record donation in database
          if (user) {
            await supabase.from('donations').insert({
              user_id: user.id,
              amount: Math.round(amountValue * 100),
              currency: 'usd',
              stripe_payment_intent_id: result.productIdentifier || 'iap',
            });
            
            const donationDate = new Date().toISOString();
            localStorage.setItem(`last_donation_${user.id}`, donationDate);
          }
          
          toast({
            title: "Thank you!",
            description: "Your donation has been processed successfully.",
          });
          onOpenChange(false);
        } else if (!result.cancelled) {
          throw new Error(result.error);
        }
      } else {
        // Use Stripe for web
        const amountInCents = Math.round(amountValue * 100);
        
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

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Purchases restored successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore purchases",
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
            {loading ? "Processing..." : useIAP ? "Purchase Donation" : "Donate Now"}
          </Button>

          {useIAP && (
            <Button
              onClick={handleRestorePurchases}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restore Purchases
            </Button>
          )}

          {useIAP && (
            <p className="text-xs text-muted-foreground text-center">
              Using Apple In-App Purchase. Select a preset amount above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};