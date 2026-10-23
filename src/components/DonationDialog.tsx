import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { ChevronDown, Eye, EyeOff, HandCoins, Loader2 } from "lucide-react";
import { DONOR_TEXT } from "@/config/donorTiers";
import { DonorTierName } from "./DonorTierName";
import { DONOR_TIERS, TIER_ICONS, GIFT_CROSS_ICON } from "@/config/donorTiers";
import { DEFAULT_GIFT_AMOUNT, DEFAULT_YEARLY_AMOUNT, GIFT_SLIDER_AMOUNTS, YEARLY_SLIDER_AMOUNTS, getGiftPreview, giftAfterModeToggle, giftImpact, minimumGift } from "@/config/donationGift";
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
  const [interval, setInterval_] = useState<DonationInterval>(DEFAULT_DONATION_INTERVAL);
  const [tiersOpen, setTiersOpen] = useState(false);
  // Archangel pulses only the very first time the tiers list is opened.
  const [tiersPulse, setTiersPulse] = useState(() => {
    try { return !localStorage.getItem("donor-tiers-intro-seen"); } catch { return true; }
  });
  const [anonymous, setAnonymous] = useState(false);
  const [oneTime, setOneTime] = useState(false);
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

  // Opening/closing the tiers list; the first open ever shows the Archangel pulse.
  const toggleTiers = (next: boolean) => {
    setTiersOpen(next);
    if (!next) {
      try { localStorage.setItem("donor-tiers-intro-seen", "1"); } catch { /* private mode */ }
      setTiersPulse(false);
    }
  };

  // Flipping between a monthly gift and a one-time gift starts the amount over at $0.
  const toggleOneTime = () => {
    setOneTime(!oneTime);
    const next = giftAfterModeToggle();
    setSelectedAmount(next.amount);
    setCustomAmount(next.customAmount);
    setUseCustom(next.useCustom);
  };

  const chooseInterval = (next: DonationInterval) => {
    setInterval_(next);
    setUseCustom(false); setCustomAmount("");
    setSelectedAmount(next === "year" ? DEFAULT_YEARLY_AMOUNT : DEFAULT_GIFT_AMOUNT);
  };
  const mode = oneTime ? "once" : interval;
  const minAmount = isNative ? 1 : minimumGift(mode);

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

  const SLIDER_STEPS: readonly number[] = isNative ? NATIVE_PRESETS : interval === "year" ? YEARLY_SLIDER_AMOUNTS : GIFT_SLIDER_AMOUNTS;

  // Tier this gift alone would qualify for (lifetime total can only be higher).
  const effectiveAmount = getEffectiveAmount();
  const giftPreview = getGiftPreview(effectiveAmount, useCustom, SLIDER_STEPS);
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

    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to donate so your gift is tied to your account.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseDonation(productId, user.id);
      if (result.success) {
        onOpenChange(false);
        // Record donation (verified server-side) + thank-you email and message
        const { data } = await supabase.functions.invoke("record-donation", {
          body: { productId, transactionId: result.transactionId, appUserId: result.appUserId },
        }).catch((e) => { console.error(e); return { data: null }; });
        if (data?.status === "confirmed") {
          // Show the thank-you sticker
          window.dispatchEvent(new Event("orthocross:donation-completed"));
        } else {
          toast({ title: "Thank you for your donation!", description: "It will appear in the Donators section once the app store confirms it." });
        }
      } else if (!result.cancelled) {
        toast({ title: "Purchase failed", description: result.error || "Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Web path, one-time gift: Stripe Checkout (single payment)
  const handleOneTimeDonate = async () => {
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
      const { data, error } = await supabase.functions.invoke("create-donation", {
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

  // Web path: Stripe Checkout (monthly subscription)
  const handleWebDonate = async () => {
    const amount = getEffectiveAmount();
    if (isNaN(amount) || amount < minAmount) {
      toast({ title: "Invalid amount", description: `Minimum gift is $${minAmount}.00`, variant: "destructive" });
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
    } else if (oneTime) {
      handleOneTimeDonate();
    } else {
      handleWebDonate();
    }
  };

  const stepIndex = giftPreview.sliderIndex;
  const shownAmount = effectiveAmount >= 1 ? (Number.isInteger(effectiveAmount) ? effectiveAmount : effectiveAmount.toFixed(2)) : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[72vh] overflow-y-auto overscroll-contain p-6">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-3xl font-bold leading-tight">Become a donator,<br />support OrthoCross</DialogTitle>
          <DialogDescription className="sr-only">Your gift keeps OrthoCross free for everyone.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed">
          <p className="font-medium">A note from the creator of OrthoCross</p>
          <p className="mt-1 text-muted-foreground">I built OrthoCross on my own savings so every believer could pray, read, and learn without ads or paywalls. Running it costs real money each month. If it has blessed you, even a small gift keeps it alive for everyone. God bless.</p>
        </div>


        <div className="pt-2 space-y-2">
          <div>
            <h3 className="text-3xl font-bold">Gift what you want</h3>
            {!isNative && <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">No commitment · cancel anytime</p>}
          </div>

          {!isNative && !oneTime && (
            <div role="radiogroup" aria-label="Billing" className="mx-auto grid w-full max-w-xs grid-cols-2 rounded-full border p-1">
              {(["month", "year"] as const).map(v => (
                <Button key={v} type="button" role="radio" aria-checked={interval === v} variant={interval === v ? "sacred" : "ghost"} onClick={() => chooseInterval(v)} className="h-8 rounded-full text-xs">
                  {v === "month" ? "Monthly" : "Yearly"}
                </Button>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <div className={`donor-tier-${giftTier?.key ?? "angel"} donor-gift-glow donor-gift-glow-${giftPreview.glowLevel} h-20 w-20 overflow-hidden rounded-full bg-muted transition-all motion-reduce:transition-none`}>
              <img src={giftTier ? TIER_ICONS[giftTier.key] : GIFT_CROSS_ICON} alt={giftTier ? giftTier.name : "Orthodox cross"} className="h-full w-full object-cover" />
            </div>
            <p className="text-4xl font-bold text-primary">${shownAmount}{!isNative && !oneTime && (interval === "year" ? "/year" : "/month")}</p>
            {!isNative && !oneTime && interval === "year" && effectiveAmount >= 12 && (
              <p className="text-xs text-muted-foreground">About ${(effectiveAmount / 12).toFixed(2)} a month</p>
            )}
            <p className="text-sm text-muted-foreground text-center">{effectiveAmount >= minAmount ? giftImpact(effectiveAmount, isNative ? "once" : mode) : "Your gift keeps OrthoCross free for everyone."}</p>
          </div>

          {(isNative || !oneTime) && (
            <>
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
            </>
          )}

          {!isNative && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="custom-amount"
                aria-label="Custom amount"
                type="number" step="0.01" min={minAmount}
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true); }}
                onFocus={() => setUseCustom(true)}
                className="pl-7"
                placeholder={interval === "year" && !oneTime ? "Custom amount ($12 minimum)" : "Custom amount"}
              />
            </div>
          )}

          <div className="rounded-xl border">
            <Button type="button" variant="ghost" aria-expanded={tiersOpen} onClick={() => toggleTiers(!tiersOpen)} className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-sm font-medium">
              <span>Donator tiers{giftTier && <> · <span className={`donor-tier-${giftTier.key} text-[hsl(var(--donor-tier-tone))]`}><DonorTierName tier={giftTier} /></span></>}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${tiersOpen ? "rotate-180" : ""}`} />
            </Button>
            {tiersOpen && (
              <ul className="space-y-1 px-3 pb-3">
                {DONOR_TIERS.map((t) => {
                  const current = giftTier?.key === t.key;
                  return (
                    <li key={t.key}>
                      <Button type="button" variant="ghost" className={`donor-tier-${t.key} donor-gift-tier-option ${t.key === "archangel" && tiersPulse ? "donor-gift-tier-pulse" : ""} h-auto w-full justify-between gap-2 whitespace-normal px-3 py-2 text-sm ${current ? "font-semibold" : ""}`} onClick={() => {
                        setCustomAmount(String(t.minCents / 100));
                        setSelectedAmount(t.minCents / 100);
                        setUseCustom(true);
                        toggleTiers(false);
                      }}>
                        <span><DonorTierName tier={t} />{current && " · this gift"}</span>
                        <span>${(t.minCents / 100).toLocaleString()}+</span>
                      </Button>
                    </li>
                  );
                })}
                <li className="px-3 pt-1 text-xs text-muted-foreground">Tiers reflect your lifetime donations.</li>
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isNative && (
              <Button variant="ghost"
                type="button" role="switch" aria-checked={oneTime} aria-label={DONOR_TEXT.oneTimeFull}
                onClick={toggleOneTime}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${oneTime ? "donor-anon-active" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}
              >
                <HandCoins className="h-3.5 w-3.5" />
                <span>{DONOR_TEXT.oneTime}</span>
                <span aria-hidden="true" className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${oneTime ? "bg-[hsl(var(--donor-anon))]" : "bg-muted-foreground/40"}`}>
                  <span className={`absolute left-0.5 top-0.5 block h-3 w-3 rounded-full bg-background shadow transition-transform ${oneTime ? "translate-x-3" : "translate-x-0"}`} />
                </span>
              </Button>
            )}
            <Button variant="ghost"
              type="button" role="switch" aria-checked={anonymous} aria-label={DONOR_TEXT.donateAnonymously}
              onClick={() => updateAnonymous(!anonymous)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${anonymous ? "donor-anon-active" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}
            >
              {anonymous ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{DONOR_TEXT.donateAnonymouslyShort}</span>
              <span aria-hidden="true" className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${anonymous ? "bg-[hsl(var(--donor-anon))]" : "bg-muted-foreground/40"}`}>
                <span className={`absolute left-0.5 top-0.5 block h-3 w-3 rounded-full bg-background shadow transition-transform ${anonymous ? "translate-x-3" : "translate-x-0"}`} />
              </span>
            </Button>
          </div>

          {isNative && productsAvailable === false && (
            <p className="text-xs text-destructive text-center">In-app purchases are not available right now. Please try again later.</p>
          )}

          <Button onClick={handleDonate} disabled={loading || (isNative && productsAvailable === false)} className="h-14 w-full rounded-full text-lg" variant="sacred">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Donate"}
          </Button>

          <p className="text-xs text-muted-foreground">
            {isNative
              ? "One-time donation processed securely through the app store."
              : oneTime
                ? "A single gift, processed securely by Stripe."
                : interval === "year" ? "Your gift renews yearly at the same amount and is processed securely by Stripe. You can cancel anytime from Settings." : "Your gift renews monthly at the same amount and is processed securely by Stripe. You can cancel anytime from Settings."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
