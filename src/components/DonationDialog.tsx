import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { CalendarHeart, EyeOff, Heart, Loader2 } from "lucide-react";
import { DONOR_TEXT } from "@/config/donorTiers";
import { getTier, TIER_ICONS } from "@/config/donorTiers";
import { DEFAULT_DONATION_INTERVAL, type DonationInterval } from "../../supabase/functions/_shared/donationBilling";
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
  const [interval, setInterval] = useState<DonationInterval>(DEFAULT_DONATION_INTERVAL);
  const [anonymous, setAnonymous] = useState(false);
  const [productsAvailable, setProductsAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const PRESET_AMOUNTS = isNative ? NATIVE_PRESETS : WEB_PRESETS;

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("donor_anonymous").eq("id", user.id).maybeSingle()
      .then(({ data }) => { setAnonymous(!!data?.donor_anonymous); });
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

  // Tier this gift alone would qualify for (lifetime total can only be higher).
  const effectiveAmount = getEffectiveAmount();
  const giftTier = effectiveAmount >= 1 ? getTier(Math.round(effectiveAmount * 100)) : null;

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
      const { data, error } = await supabase.functions.invoke("create-monthly-donation", {
        body: { amount: Math.round(amount * 100), interval },
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

  const handleDonate = async () => {
    if (isNative) {
      handleNativeDonate();
    } else {
      handleWebDonate();
    }
  };

  const intervalLabel = interval === "month" ? "month" : "year";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarHeart className="w-5 h-5 text-primary" />
            Support OrthoCross
          </DialogTitle>
          {!isNative && (
            <DialogDescription className="text-sm text-muted-foreground text-left">
              Your gift keeps OrthoCross free for everyone.
            </DialogDescription>
          )}
          {!isNative && (
            <div className="mt-2" role="radiogroup" aria-label="Donation frequency">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  role="radio"
                  aria-checked={interval === "month"}
                  onClick={() => setInterval("month")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${interval === "month" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={interval === "year"}
                  onClick={() => setInterval("year")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${interval === "year" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Yearly
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1.5">Recurring · cancel anytime</p>
            </div>
          )}
        </DialogHeader>


        <div className="space-y-4 pt-2">
          {/* Preset amounts */}
          <div className="space-y-2">
            <Label>Choose an amount (USD)</Label>
            <div className={`grid gap-2 pt-1.5 ${isNative ? "grid-cols-4" : "grid-cols-5"}`}>
              {PRESET_AMOUNTS.map((preset) => (
                <div key={preset} className="relative">
                  {preset === 10 && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-primary px-1.5 py-px text-[10px] font-medium leading-tight text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <Button
                    variant={!useCustom && selectedAmount === preset ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => { setSelectedAmount(preset); setUseCustom(false); }}
                  >
                    ${preset}
                  </Button>
                </div>
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

          {/* Tier incentive — the tier this gift alone qualifies for */}
          {giftTier && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <img src={TIER_ICONS[giftTier.key]} alt="" className="w-4 h-4 rounded-full object-cover" />
              <span>This gift reaches the <span className="font-medium text-foreground">{giftTier.name}</span> tier</span>
            </p>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            onClick={() => updateAnonymous(!anonymous)}
            className={`mx-auto flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
              anonymous
                ? "border-primary/60 bg-primary/10"
                : "border-border bg-muted/40 hover:bg-muted"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {anonymous ? (
                <EyeOff className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className={`block text-sm leading-tight ${anonymous ? "font-medium text-foreground" : "text-foreground"}`}>
                  {DONOR_TEXT.donateAnonymously}
                </span>
                <span className="block text-xs leading-tight text-muted-foreground">
                  {anonymous
                    ? "Your name and photo stay hidden in the Donators list."
                    : "Your name and photo will appear in the Donators list."}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span
                aria-hidden="true"
                className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                  anonymous ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-background shadow-md transition-transform ${
                    anonymous ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
              <span className={`text-[10px] font-medium uppercase tracking-wide ${anonymous ? "text-primary" : "text-muted-foreground"}`}>
                {anonymous ? "On" : "Off"}
              </span>
            </span>
          </button>



          {/* Platform note */}
          <p className="text-xs text-muted-foreground text-center">
            {isNative
              ? "One-time donation processed securely through the app store."
              : `Recurring ${intervalLabel}ly donation processed securely via Stripe.`}
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
              <><Heart className="w-4 h-4 mr-2 text-[hsl(var(--donor-heart))]" />Donate ${useCustom ? (parseFloat(customAmount) || 0).toFixed(2) : selectedAmount}{!isNative && (interval === "month" ? " / month" : " / year")}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
