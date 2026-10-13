import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { ChevronDown, Eye, EyeOff, Gift, Loader2, Sprout, User } from "lucide-react";
import { DONOR_TEXT } from "@/config/donorTiers";
import { DONOR_TIERS, TIER_ICONS } from "@/config/donorTiers";
import { DEFAULT_GIFT_AMOUNT, GIFT_SLIDER_AMOUNTS, getGiftPreview } from "@/config/donationGift";
import { DEFAULT_DONATION_INTERVAL, type DonationInterval } from "../../supabase/functions/_shared/donationBilling";
import { purchaseDonation, getAvailableDonationProducts, getProductIdForAmount } from "@/utils/inAppPurchases";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAmount?: number;
  /** Called when the dialog is closed without starting a donation (e.g. the X). */
  onCancel?: () => void;
}

const NATIVE_PRESETS = [5, 10, 25, 50];

export const DonationDialog = ({ open, onOpenChange, initialAmount, onCancel }: DonationDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState(Capacitor.isNativePlatform() ? 5 : DEFAULT_GIFT_AMOUNT);
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

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("donor_anonymous").eq("id", user.id).maybeSingle()
      .then(({ data }) => { setAnonymous(!!data?.donor_anonymous); });
  }, [open, user]);

  // Preselect the amount chosen from the tier guide (e.g. $1 for Angel) in the custom field
  useEffect(() => {
    if (open) submittedRef.current = false;
    if (!open || initialAmount === undefined) return;
    if (Capacitor.isNativePlatform()) {
      // App stores only sell fixed presets: snap to the closest available one
      const snapped = NATIVE_PRESETS.find(v => v >= initialAmount) ?? NATIVE_PRESETS[NATIVE_PRESETS.length - 1];
      setSelectedAmount(snapped);
      setUseCustom(false);
      return;
    }
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
  const giftPreview = getGiftPreview(effectiveAmount, useCustom);
  const giftTier = giftPreview.tier;

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

  const SLIDER_STEPS = isNative ? NATIVE_PRESETS : GIFT_SLIDER_AMOUNTS;
  const stepIndex = isNative ? Math.max(0, NATIVE_PRESETS.findIndex(v => v >= effectiveAmount)) : giftPreview.sliderIndex;
  const shownAmount = effectiveAmount >= 1 ? (Number.isInteger(effectiveAmount) ? effectiveAmount : effectiveAmount.toFixed(2)) : 0;
  const reasons = [
    { icon: Gift, title: "Free for everyone", body: "Your donation keeps this app and all of its features free for everyone. No paywalls, no ads.", more: "Every feature in OrthoCross is open to every believer. Donations cover servers, cloud voices and storage so nobody is ever asked to pay to pray or read." },
    { icon: User, title: "Support one developer", body: "OrthoCross is built by an Orthodox Christian with a small team, not a big corporation.", more: "Your gift supports the people writing, fixing and improving the app with care for our community." },
    { icon: Sprout, title: "Help us keep growing", body: "Donations fund new saint stories, prayers, voices, and features.", more: "Each month of support makes room for more stories, more verified prayers and better tools for the whole community." },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto overscroll-contain p-6">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-3xl font-bold leading-tight">Become a donator,<br />support OrthoCross</DialogTitle>
          <DialogDescription className="sr-only">Your gift keeps OrthoCross free for everyone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-1">
          {reasons.map((r, i) => (
            <div key={r.title} className="flex gap-4">
              <r.icon className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />
              <div className="space-y-1">
                <p className="text-base font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.body}</p>
                {openReason === i && <p className="text-sm text-muted-foreground">{r.more}</p>}
                <Button type="button" variant="link" onClick={() => setOpenReason(openReason === i ? null : i)} className="h-auto p-0 text-xs font-semibold">
                  {openReason === i ? "Show less" : "Learn more"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2">
          <div>
            <h3 className="text-3xl font-bold">Gift what you want</h3>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">No commitment · cancel anytime</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={`donor-tier-${giftTier?.key ?? "angel"} donor-gift-glow donor-gift-glow-${giftPreview.glowLevel} h-20 w-20 overflow-hidden rounded-full bg-muted transition-all motion-reduce:transition-none`}>
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
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            {SLIDER_STEPS.map((amount, i) => <span key={amount}>${amount}{!isNative && i === SLIDER_STEPS.length - 1 ? "+" : ""}</span>)}
          </div>

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
            <Button type="button" variant="ghost" aria-expanded={tiersOpen} onClick={() => setTiersOpen(!tiersOpen)} className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-sm font-medium">
              <span>Donator tiers{giftTier && <> · <span className={`donor-tier-${giftTier.key} text-[hsl(var(--donor-tier-tone))]`}>{giftTier.name}</span></>}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${tiersOpen ? "rotate-180" : ""}`} />
            </Button>
            {tiersOpen && (
              <ul className="space-y-1 px-3 pb-3">
                {DONOR_TIERS.map((t) => {
                  const current = giftTier?.key === t.key;
                  return (
                    <li key={t.key}>
                      <Button type="button" variant="ghost" className={`donor-tier-${t.key} donor-gift-tier-option h-auto w-full justify-between gap-2 whitespace-normal px-3 py-2 text-sm ${current ? "font-semibold" : ""}`} onClick={() => {
                        setCustomAmount(String(t.minCents / 100));
                        setSelectedAmount(t.minCents / 100);
                        setUseCustom(true);
                      }}>
                        <span>{t.name}{current && " · this gift"}</span>
                        <span>${(t.minCents / 100).toLocaleString()}+</span>
                      </Button>
                    </li>
                  );
                })}
                <li className="px-3 pt-1 text-xs text-muted-foreground">Tiers reflect your lifetime donations.</li>
              </ul>
            )}
          </div>

          <Button variant="ghost"
            type="button" role="switch" aria-checked={anonymous}
            onClick={() => updateAnonymous(!anonymous)}
            className={`mx-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${anonymous ? "donor-anon-active" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}
          >
            {anonymous ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{DONOR_TEXT.donateAnonymously}</span>
            <span aria-hidden="true" className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${anonymous ? "bg-[hsl(var(--donor-anon))]" : "bg-muted-foreground/40"}`}>
              <span className={`absolute left-0.5 top-0.5 block h-3 w-3 rounded-full bg-background shadow transition-transform ${anonymous ? "translate-x-3" : "translate-x-0"}`} />
            </span>
          </Button>

          {isNative && productsAvailable === false && (
            <p className="text-xs text-destructive text-center">In-app purchases are not available right now. Please try again later.</p>
          )}

          <Button onClick={handleDonate} disabled={loading || (isNative && productsAvailable === false)} className="h-14 w-full rounded-full text-lg" variant="sacred">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Donate"}
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
