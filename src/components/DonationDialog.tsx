import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { CalendarHeart, Heart, Loader2 } from "lucide-react";
import { DONOR_TEXT } from "@/config/donorTiers";
import { purchaseDonation, getAvailableDonationProducts, getProductIdForAmount } from "@/utils/inAppPurchases";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEB_PRESETS = [1, 10, 25, 50, 100];
const NATIVE_PRESETS = [5, 10, 25, 50];

export const DonationDialog = ({ open, onOpenChange }: DonationDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [monthly, setMonthly] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [productsAvailable, setProductsAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const PRESET_AMOUNTS = isNative ? NATIVE_PRESETS : WEB_PRESETS;

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("donor_anonymous").eq("id", user.id).maybeSingle()
      .then(({ data }) => setAnonymous(!!data?.donor_anonymous));
  }, [open, user]);

  const updateAnonymous = async (value: boolean) => {
    setAnonymous(value);
    if (user) await supabase.from("profiles").update({ donor_anonymous: value }).eq("id", user.id);
  };

  // On native, check if IAP products are available when dialog opens
  useEffect(() => {
    if (!open || !isNative) return;
    getAvailableDonationProducts().then(pkgs => {
      setProductsAvailable(pkgs.length > 0);
    });
  }, [open, isNative]);

  const getEffectiveAmount = (): number => {
    if (useCustom) return parseFloat(customAmount) || 0;
    return selectedAmount;
  };

  // Native path: RevenueCat in-app purchase (required by App Store / Play Store)
  const handleNativeDonate = async () => {
    const amount = getEffectiveAmount();
    if (isNaN(amount) || amount < 1) {
      toast({ title: "Invalid amount", description: "Please enter at least $1.", variant: "destructive" });
      return;
    }

    const productId = getProductIdForAmount(Math.round(amount));
    if (!productId) {
      toast({
        title: "Amount not available",
        description: "Please choose $5, $10, $25, or $50 for in-app donations.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseDonation(productId);
      if (result.success) {
        onOpenChange(false);
        // Show the thank-you sticker
        window.dispatchEvent(new Event("orthocross:donation-completed"));
        // Record donation (Donators list) + thank-you email and message
        const txId = (result as any).customerInfo?.nonSubscriptionTransactions?.slice(-1)?.[0]?.transactionIdentifier;
        supabase.functions.invoke("record-donation", {
          body: { productId, transactionId: txId },
        }).catch(console.error);
      } else if (!result.cancelled) {
        toast({ title: "Purchase failed", description: result.error || "Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Web path: Stripe Checkout (monthly subscription)
  const handleWebDonate = async () => {
    const amount = getEffectiveAmount();
    if (isNaN(amount) || amount < 1) {
      toast({ title: "Invalid amount", description: "Minimum donation is $1.00", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to donate so your gift is tied to your account.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("orthocross:donation-started", new Date().toISOString());
      const { data, error } = await supabase.functions.invoke(monthly ? "create-monthly-donation" : "create-donation", {
        body: { amount: Math.round(amount * 100) },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({ title: "Error", description: error.message || "Failed to process donation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = () => {
    if (isNative) {
      handleNativeDonate();
    } else {
      handleWebDonate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarHeart className="w-5 h-5 text-primary" />
            Support OrthoCross
          </DialogTitle>
          <DialogDescription>
            <span className="block text-muted-foreground">— Acts 20:35 —</span>
            <span className="mt-1 block">"It is more blessed to give than to receive."</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Preset amounts */}
          <div className="space-y-2">
            <Label>Choose an amount (USD)</Label>
            <div className={`grid gap-2 ${isNative ? "grid-cols-4" : "grid-cols-5"}`}>
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={!useCustom && selectedAmount === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedAmount(preset); setUseCustom(false); }}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount — only on web since native IAP requires fixed store products */}
          {!isNative && (
            <div className="space-y-1">
              <Label htmlFor="custom-amount">Or enter a custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="custom-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true); }}
                  onFocus={() => setUseCustom(true)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {!isNative && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={!monthly ? "default" : "outline"} onClick={() => setMonthly(false)}>One-time</Button>
              <Button size="sm" variant={monthly ? "default" : "outline"} onClick={() => setMonthly(true)}>Monthly</Button>
            </div>
          )}

          <Button
            size="sm"
            variant={anonymous ? "secondary" : "outline"}
            className="w-full justify-center"
            aria-pressed={anonymous}
            onClick={() => updateAnonymous(!anonymous)}
          >
            {DONOR_TEXT.donateAnonymously}
          </Button>


          {/* Platform note */}
          <p className="text-xs text-muted-foreground text-center">
            {isNative
              ? "One-time donation processed securely through the app store."
              : monthly ? "Recurring monthly donation processed securely via Stripe." : "One-time donation processed securely via Stripe."}
          </p>

          {/* Native warning if products not loaded yet */}
          {isNative && productsAvailable === false && (
            <p className="text-xs text-destructive text-center">
              In-app purchases are not available right now. Please try again later.
            </p>
          )}

          <Button
            onClick={handleDonate}
            disabled={loading || (isNative && productsAvailable === false)}
            className="w-full"
            variant="sacred"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Heart className="w-4 h-4 mr-2 text-[hsl(var(--donor-heart))]" />Donate ${useCustom ? (parseFloat(customAmount) || 0).toFixed(2) : selectedAmount}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
