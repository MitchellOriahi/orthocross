import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { CalendarHeart, Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { DONOR_TEXT } from "@/config/donorTiers";
import { getTier, TIER_ICONS } from "@/config/donorTiers";
import { DEFAULT_DONATION_INTERVAL, type DonationInterval } from "../../supabase/functions/_shared/donationBilling";
import { purchaseDonation, getAvailableDonationProducts, getProductIdForAmount } from "@/utils/inAppPurchases";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAmount?: number;
  /** Called when the dialog is closed without starting a donation (e.g. the X). */
  onCancel?: () => void;
}

// Configurable starting suggestions; checkout accepts any amount ≥ $1 (validated server-side).
const WEB_PRESETS: Record<DonationInterval, number[]> = { month: [3, 5, 10, 25], year: [30, 50, 100] };
const DEFAULT_WEB_AMOUNT: Record<DonationInterval, number> = { month: 5, year: 30 };
const NATIVE_PRESETS = [5, 10, 25, 50];

export const DonationDialog = ({ open, onOpenChange, initialAmount, onCancel }: DonationDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState(DEFAULT_WEB_AMOUNT.month);
  const submittedRef = useRef(false);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interval, setIntervalState] = useState<DonationInterval>(DEFAULT_DONATION_INTERVAL);
  const [anonymous, setAnonymous] = useState(false);
  const [productsAvailable, setProductsAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const PRESET_AMOUNTS = isNative ? NATIVE_PRESETS : WEB_PRESETS[interval];
  const setInterval = (next: DonationInterval) => {
    setIntervalState(next);
    if (!useCustom) setSelectedAmount(DEFAULT_WEB_AMOUNT[next]);
  };

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("donor_anonymous").eq("id", user.id).maybeSingle()
      .then(({ data }) => { setAnonymous(!!data?.donor_anonymous); });
  }, [open, user]);

  // Preselect the amount chosen from the tier guide (e.g. $1 for Angel) in the custom field
  useEffect(() => {
    if (open) submittedRef.current = false;
    if (!open || initialAmount === undefined) return;
    setSelectedAmount(initialAmount);
    setUseCustom(true);
    setCustomAmount(String(initialAmount));
  }, [open, initialAmount]);

  const handleOpenChange = (next: boolean) => {
    if (!next && !submittedRef.current) onCancel?.();
    onOpenChange(next);
  };

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
    submittedRef.current = true;
    if (isNative) {
      handleNativeDonate();
    } else {
      handleWebDonate();
    }
  };

  const intervalLabel = interval === "month" ? "month" : "year";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarHeart className="w-5 h-5 text-primary" />
            Help keep OrthoCross growing
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-left">
            OrthoCross helps you stay connected to Scripture, Orthodox history, and the lives of the saints. Your support helps us maintain and improve the app while keeping its core features accessible to everyone.
          </DialogDescription>
          <details className="group mt-1 rounded-lg border border-primary/30 bg-muted/30 px-3 py-2 text-left">
            <summary className="cursor-pointer list-none text-sm font-medium text-primary">
              Why support OrthoCross?
            </summary>
            <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Built with care, by one developer</p>
              <p>OrthoCross is an independent project built and maintained by a single developer with a love for the Orthodox Christian faith and a desire to help others grow in it. Every improvement, new feature, and refinement is part of an ongoing effort to make OrthoCross a more helpful companion in your daily walk of faith.</p>
              <p>Your support helps me continue developing the app, maintaining its services, and bringing new ideas to life. If OrthoCross has helped you build a Bible-reading habit, discover the lives of the saints, or deepen your understanding of Orthodox Christianity, I'd be grateful for your help in keeping this project growing.</p>
              <p>There's no obligation to give. I'm glad you're here, and I hope OrthoCross continues to be a blessing in your daily life. Thank you for supporting this little corner of the Orthodox world.</p>
            </div>
          </details>
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
            <div className={`grid gap-2 ${PRESET_AMOUNTS.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {PRESET_AMOUNTS.map((preset) => (
                <div key={preset}>
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
            className={`mx-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              anonymous
                ? "donor-anon-active"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            {anonymous ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            <span>{DONOR_TEXT.donateAnonymously}</span>
            <span
              aria-hidden="true"
              className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                anonymous ? "bg-[hsl(var(--donor-anon))]" : "bg-muted-foreground/40"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 block h-3 w-3 rounded-full bg-background shadow transition-transform ${
                  anonymous ? "translate-x-3" : "translate-x-0"
                }`}
              />
            </span>
          </button>



          {/* Platform note */}
          <p className="text-xs text-muted-foreground text-center">
            {isNative
              ? "One-time donation processed securely through the app store."
              : `A voluntary gift of $${effectiveAmount.toFixed(2)}, charged every ${intervalLabel} via Stripe until you cancel. It unlocks no paid features. You can cancel anytime from Settings → Manage donation.`}
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
              <><Heart className="w-4 h-4 mr-2 text-[hsl(var(--donor-heart))]" />Support OrthoCross — ${useCustom ? (parseFloat(customAmount) || 0).toFixed(2) : selectedAmount}{!isNative && (interval === "month" ? "/month" : "/year")}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
