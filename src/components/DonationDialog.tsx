import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { ChevronDown, Eye, EyeOff, Gift, Loader2, Sprout, User } from "lucide-react";
import { DONOR_TEXT } from "@/config/donorTiers";
import { DONOR_TIERS, getTier, TIER_ICONS } from "@/config/donorTiers";
import { DEFAULT_DONATION_INTERVAL, type DonationInterval } from "../../supabase/functions/_shared/donationBilling";
import { purchaseDonation, getAvailableDonationProducts, getProductIdForAmount } from "@/utils/inAppPurchases";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAmount?: number;
  /** Called when the dialog is closed without starting a donation (e.g. the X). */
  onCancel?: () => void;
}

const WEB_PRESETS = [1, 10, 25, 50, 100];
const NATIVE_PRESETS = [5, 10, 25, 50];

export const DonationDialog = ({ open, onOpenChange, initialAmount, onCancel }: DonationDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const submittedRef = useRef(false);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const interval: DonationInterval = DEFAULT_DONATION_INTERVAL;
  const [openReason, setOpenReason] = useState<number | null>(null);
  const [tiersOpen, setTiersOpen] = useState(false);
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

  const SLIDER_STEPS = isNative ? NATIVE_PRESETS : [1, 5, 10, 15, 20, 25, 50, 100];
  const stepIndex = Math.max(0, SLIDER_STEPS.findIndex((v) => v >= effectiveAmount));
  const shownAmount = effectiveAmount >= 1 ? (Number.isInteger(effectiveAmount) ? effectiveAmount : effectiveAmount.toFixed(2)) : 0;
  const reasons = [
    { icon: Gift, title: "Free for everyone, forever", body: "Scripture, saints, prayers, read-aloud and the History islands stay free — no paywalls, no ads.", more: "Every feature in OrthoCross is open to every believer. Donations cover servers, cloud voices and storage so nobody is ever asked to pay to pray or read." },
    { icon: User, title: "Support one developer", body: "OrthoCross is built by one Orthodox Christian, not a big corporation.", more: "There are no investors or sponsors. Your gift goes straight to the person writing, fixing and improving the app in their own time." },
    { icon: Sprout, title: "Help it keep growing", body: "Gifts fund new saints, prayers, voices and features.", more: "Each month of support makes room for more stories, more verified prayers and better tools for the whole community." },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="text-left space-y-3 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Become a donator</p>
          <DialogTitle className="text-3xl font-bold leading-tight">Become a donator,<br />support OrthoCross</DialogTitle>
          <DialogDescription className="sr-only">Your gift keeps OrthoCross free for everyone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {reasons.map((r, i) => (
            <div key={r.title} className="flex gap-4">
              <r.icon className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />
              <div className="space-y-1">
                <p className="text-lg font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.body}</p>
                {openReason === i && <p className="text-sm text-muted-foreground">{r.more}</p>}
                <button type="button" onClick={() => setOpenReason(openReason === i ? null : i)} className="text-sm font-semibold text-primary">
                  {openReason === i ? "Show less" : "Learn more"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 space-y-5">
          <div>
            <h3 className="text-3xl font-bold">Pay what you want</h3>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">No commitment · cancel anytime</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={`donor-tier-${giftTier?.key ?? "none"} donor-avatar-ring h-28 w-28 overflow-hidden rounded-full bg-muted transition-all`}>
              {giftTier && <img src={TIER_ICONS[giftTier.key]} alt={giftTier.name} className="h-full w-full object-cover" />}
            </div>
            <p className="text-4xl font-bold text-primary">${shownAmount}{!isNative && "/month"}</p>
            <p className="text-sm text-muted-foreground text-center">Your gift keeps OrthoCross free for everyone.</p>
          </div>

          <input
            type="range"
            aria-label="Donation amount"
            min={0}
            max={SLIDER_STEPS.length - 1}
            step={1}
            value={stepIndex}
            onChange={(e) => { const v = SLIDER_STEPS[Number(e.target.value)]; setSelectedAmount(v); setUseCustom(false); setCustomAmount(""); }}
            className="w-full accent-[hsl(var(--primary))]"
          />

          {!isNative && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="custom-amount"
                aria-label="Custom amount"
                type="number" step="0.01" min="1"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true); }}
                onFocus={() => setUseCustom(true)}
                className="pl-7"
                placeholder="Custom amount"
              />
            </div>
          )}

          <div className="rounded-xl border">
            <button type="button" onClick={() => setTiersOpen(!tiersOpen)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
              <span>Donator tiers{giftTier && <> · <span className={`donor-tier-${giftTier.key} text-[hsl(var(--donor-tier-tone))]`}>{giftTier.name}</span></>}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${tiersOpen ? "rotate-180" : ""}`} />
            </button>
            {tiersOpen && (
              <ul className="space-y-1 px-3 pb-3">
                {[...DONOR_TIERS].reverse().map((t) => {
                  const current = giftTier?.key === t.key;
                  return (
                    <li key={t.key} className={`donor-tier-${t.key} flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${current ? "bg-[hsl(var(--donor-tier-tone)/0.15)] font-semibold" : ""}`}>
                      <span className="text-[hsl(var(--donor-tier-tone))]">{t.name}{current && " · this gift"}</span>
                      <span className="text-muted-foreground">${(t.minCents / 100).toLocaleString()}+</span>
                    </li>
                  );
                })}
                <li className="px-3 pt-1 text-xs text-muted-foreground">Tiers reflect your lifetime donations.</li>
              </ul>
            )}
          </div>

          <button
            type="button" role="switch" aria-checked={anonymous}
            onClick={() => updateAnonymous(!anonymous)}
            className={`mx-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${anonymous ? "donor-anon-active" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}
          >
            {anonymous ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{DONOR_TEXT.donateAnonymously}</span>
            <span aria-hidden="true" className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${anonymous ? "bg-[hsl(var(--donor-anon))]" : "bg-muted-foreground/40"}`}>
              <span className={`absolute left-0.5 top-0.5 block h-3 w-3 rounded-full bg-background shadow transition-transform ${anonymous ? "translate-x-3" : "translate-x-0"}`} />
            </span>
          </button>

          {isNative && productsAvailable === false && (
            <p className="text-xs text-destructive text-center">In-app purchases are not available right now. Please try again later.</p>
          )}

          <Button onClick={handleDonate} disabled={loading || (isNative && productsAvailable === false)} className="h-14 w-full rounded-full text-lg" variant="sacred">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Become a donator"}
          </Button>

          <p className="text-xs text-muted-foreground">
            {isNative
              ? "One-time donation processed securely through the app store."
              : "Your gift renews monthly at the same amount and is processed securely by Stripe. You can cancel anytime from Settings."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
