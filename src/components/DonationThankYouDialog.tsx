import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DONOR_TEXT, DONOR_TIERS, TIER_ICONS } from "@/config/donorTiers";

export const DONATION_COMPLETED_EVENT = "orthocross:donation-completed";

interface DonorStatus {
  tierKey: string | null;
  nextTierKey: string | null;
  remainingCents: number;
  name: string;
  latestDonation: { id: string; previousTierKey: string | null } | null;
}

const tierByKey = (k: string | null) => DONOR_TIERS.find((t) => t.key === k) ?? null;

export const DonationThankYouDialog = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DonorStatus | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const waitForConfirmation = useCallback(async (since: string) => {
    setOpen(true); setStatus(null); setTimedOut(false);
    for (let i = 0; i < 30; i++) {
      const { data } = await supabase.functions.invoke("donor-status", { body: { since } });
      if (data?.latestDonation) { setStatus(data); window.dispatchEvent(new Event("orthocross:donors-changed")); return; }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setTimedOut(true);
  }, []);

  useEffect(() => {
    const onDone = () => waitForConfirmation(new Date(Date.now() - 60_000).toISOString());
    window.addEventListener(DONATION_COMPLETED_EVENT, onDone);
    return () => window.removeEventListener(DONATION_COMPLETED_EVENT, onDone);
  }, [waitForConfirmation]);

  useEffect(() => {
    if (!user) return;
    const result = searchParams.get("donation");
    if (result !== "success" && result !== "monthly_success") return;
    const started = localStorage.getItem("orthocross:donation-started");
    const since = new Date((started ? Date.parse(started) : Date.now() - 3_600_000) - 60_000).toISOString();
    localStorage.setItem(`donation_thank_you_${user.id}`, new Date().toISOString());
    if (result === "monthly_success") localStorage.setItem(`monthly_donor_${user.id}`, "true");
    searchParams.delete("donation");
    searchParams.delete("session_id");
    setSearchParams(searchParams, { replace: true });
    waitForConfirmation(since);
  }, [user, searchParams, setSearchParams, waitForConfirmation]);

  if (!open) return null;

  const tier = tierByKey(status?.tierKey ?? null);
  const prev = tierByKey(status?.latestDonation?.previousTierKey ?? null);
  const next = tierByKey(status?.nextTierKey ?? null);
  const rose = !!tier && tier.key !== prev?.key;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6 animate-fade-in" role="dialog" aria-modal="true">
      <div className="donor-rays pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />
      <button onClick={() => setOpen(false)} className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full p-2 text-muted-foreground hover:text-foreground" aria-label="Close">
        <X className="h-6 w-6" />
      </button>

      <div className="relative w-full max-w-sm text-center space-y-5">
        {!status ? (
          <div className="space-y-4 text-muted-foreground">
            {timedOut ? (
              <p>Stripe hasn't confirmed your donation yet. It will appear in the Donators section as soon as it does. Thank you!</p>
            ) : (
              <><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p>{DONOR_TEXT.pending}</p></>
            )}
          </div>
        ) : (
          <>
            {tier && (
              <img src={TIER_ICONS[tier.key]} alt={tier.name} width={160} height={160}
                className={`donor-sticker mx-auto h-40 w-40 rounded-full object-cover ring-1 ring-primary/60 ${rose ? "donor-sticker-rise" : ""}`} />
            )}
            <h2 className="text-3xl font-serif text-primary">{DONOR_TEXT.thankYouTitle(status.name)}</h2>
            <p className="text-foreground/90 leading-relaxed">{DONOR_TEXT.thankYouBody}</p>
            {tier && <p className="text-lg font-semibold text-foreground">{DONOR_TEXT.youAreNow(tier)}</p>}
            {rose && tier ? (
              <p className="text-xl font-semibold text-primary">{DONOR_TEXT.risen(prev, tier)}</p>
            ) : next ? (
              <p className="text-sm text-muted-foreground">{DONOR_TEXT.toNext(status.remainingCents, next)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{DONOR_TEXT.topTier}</p>
            )}
          </>
        )}
        <Button variant="sacred" className="w-full" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </div>,
    document.body,
  );
};
