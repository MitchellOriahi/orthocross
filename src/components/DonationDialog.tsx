import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isIAPAvailable, purchaseDonation, getProductIdForAmount, restorePurchases } from "@/utils/inAppPurchases";
import { RefreshCw, Heart, CalendarHeart } from "lucide-react";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationDialog = ({ open, onOpenChange }: DonationDialogProps) => {
  const [oneTimeAmount, setOneTimeAmount] = useState("5.00");
  const [monthlyAmount, setMonthlyAmount] = useState("5.00");
  const [loading, setLoading] = useState(false);
  const [useIAP, setUseIAP] = useState(false);
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setUseIAP(isIAPAvailable());
  }, [open]);

  const handleOneTimeDonate = async () => {
    const amountValue = parseFloat(oneTimeAmount);
    
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
          if (user) {
            await supabase.from('donations').insert({
              user_id: user.id,
              amount: Math.round(amountValue * 100),
              currency: 'usd',
              stripe_payment_intent_id: result.productIdentifier || 'iap',
            });
            
            // Store one-time donation date - suppress prompt for 1 month
            const donationDate = new Date().toISOString();
            localStorage.setItem(`last_one_time_donation_${user.id}`, donationDate);
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
        const amountInCents = Math.round(amountValue * 100);
        
        const { data, error } = await supabase.functions.invoke("create-donation", {
          body: { amount: amountInCents },
        });

        if (error) throw error;

        if (user) {
          const donationDate = new Date().toISOString();
          localStorage.setItem(`last_one_time_donation_${user.id}`, donationDate);
        }

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

  const handleMonthlyDonate = async () => {
    const amountValue = parseFloat(monthlyAmount);
    
    if (isNaN(amountValue) || amountValue < 5.00) {
      toast({
        title: "Invalid amount",
        description: "Minimum monthly donation is $5.00",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const amountInCents = Math.round(amountValue * 100);
      
      const { data, error } = await supabase.functions.invoke("create-monthly-donation", {
        body: { amount: amountInCents },
      });

      if (error) throw error;

      if (user) {
        // Mark as monthly subscriber - this will permanently suppress prompt
        localStorage.setItem(`monthly_donor_${user.id}`, 'true');
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Monthly donation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process monthly donation",
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

  const oneTimePresets = [5, 10, 25, 50];
  const monthlyPresets = [5, 10, 20, 50];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support OrthoCross</DialogTitle>
          <DialogDescription>
            Your donation helps us spread the Gospel and maintain this free app for everyone.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={donationType} onValueChange={(v) => setDonationType(v as "one-time" | "monthly")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="one-time" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              One-Time
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <CalendarHeart className="w-4 h-4" />
              Monthly
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="one-time" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="one-time-amount">Donation Amount (USD)</Label>
              <div className="flex gap-2 mb-3">
                {oneTimePresets.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setOneTimeAmount(preset.toFixed(2))}
                    className="flex-1"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="one-time-amount"
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={oneTimeAmount}
                  onChange={(e) => setOneTimeAmount(e.target.value)}
                  className="pl-7"
                  placeholder="5.00"
                />
              </div>
            </div>

            <Button 
              onClick={handleOneTimeDonate} 
              disabled={loading}
              className="w-full"
              variant="sacred"
            >
              {loading ? "Processing..." : useIAP ? "Purchase Donation" : "Donate Now"}
            </Button>

            {useIAP && (
              <>
                <Button
                  onClick={handleRestorePurchases}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restore Purchases
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Using Apple In-App Purchase. Select a preset amount above.
                </p>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-amount">Monthly Amount (USD)</Label>
              <div className="flex gap-2 mb-3">
                {monthlyPresets.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthlyAmount(preset.toFixed(2))}
                    className="flex-1"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="monthly-amount"
                  type="number"
                  step="1"
                  min="5"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  className="pl-7"
                  placeholder="5.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You can cancel your monthly donation at any time.
              </p>
            </div>

            <Button 
              onClick={handleMonthlyDonate} 
              disabled={loading}
              className="w-full"
              variant="sacred"
            >
              {loading ? "Processing..." : "Start Monthly Donation"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
