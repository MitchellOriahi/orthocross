import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DonationDialog } from "./DonationDialog";
import { AppRatingDialog } from "./AppRatingDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  applyDonorStatus, choosePrompt, loadState, markDismissed, markEvent, markShown,
  saveState, sessionGuard, updateState, type DonorStatus, type PromptType,
} from "@/lib/promptScheduler";

/** Shared coordinator: shows at most one donation sticker OR rating prompt, only on the Board. */
export const DonationPromptDialog = () => {
  const [active, setActive] = useState<PromptType | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || sessionGuard.used) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      let status: DonorStatus = "unknown";
      try {
        const { data, error } = await supabase.functions.invoke("check-monthly-donation");
        if (!error && data && typeof data.hasActiveMonthlyDonation === "boolean") {
          status = data.hasActiveMonthlyDonation ? "active" : "inactive";
        }
      } catch { /* unknown -> no prompt */ }
      if (cancelled || sessionGuard.used) return;
      const now = Date.now();
      let s = applyDonorStatus(loadState(user.id), status, now);
      const legacy = localStorage.getItem(`last_one_time_donation_${user.id}`);
      const legacyAt = legacy ? Date.parse(legacy) : NaN;
      if (Number.isFinite(legacyAt) && (s.lastDonatedAt ?? 0) < legacyAt) s = { ...s, lastDonatedAt: legacyAt };
      let choice = choosePrompt(s, now, status);
      if (choice === "rating" && Capacitor.getPlatform() === "web") choice = null;
      // Defer if another dialog is already open; never stack prompts.
      if (choice && document.querySelector('[role="dialog"], [role="alertdialog"]')) choice = null;
      if (choice) {
        s = markEvent(s, `${choice}_eligible`, now);
        s = markShown(s, choice, now);
        sessionGuard.use();
        setActive(choice);
      }
      saveState(user.id, s);
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [user]);

  const dismiss = (type: PromptType) => {
    setActive(null);
    if (user) updateState(user.id, s => markDismissed(s, type, Date.now()));
  };

  const handleDonate = () => {
    setActive(null);
    if (user) updateState(user.id, s => markEvent(s, "donation_clicked", Date.now()));
    setShowDonation(true);
  };

  return (
    <>
      <Dialog open={active === "donation"} onOpenChange={(open) => !open && dismiss("donation")}>
        <DialogContent className="w-[92%] max-w-sm rounded-2xl sm:rounded-2xl p-6">
          <DialogHeader className="text-center items-center space-y-4 pt-2">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Enjoying OrthoCross?</DialogTitle>
            <DialogDescription className="text-base text-center">
              If this app has helped you stay connected to Scripture and the Orthodox faith, consider supporting its continued growth.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button variant="sacred" onClick={handleDonate} className="w-full">Support OrthoCross</Button>
            <Button variant="ghost" onClick={() => dismiss("donation")} className="w-full text-muted-foreground">Maybe later</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AppRatingDialog open={active === "rating"} onClose={() => dismiss("rating")} />
      <DonationDialog open={showDonation} onOpenChange={setShowDonation} />
    </>
  );
};
