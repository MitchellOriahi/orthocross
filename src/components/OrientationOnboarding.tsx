import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ORTHODOX_BRANCHES } from "@/data/profileIdentity";
import { applyBranchPreferences, hasStoredOrientation, orientationForBranch, setOrientation } from "@/lib/orthodoxOrientation";

const doneKey = (id: string) => `orientation-onboarded:${id}`;
const ORIENTAL = ORTHODOX_BRANCHES.filter(b => b.tradition === "oriental");
const EASTERN = ORTHODOX_BRANCHES.filter(b => b.tradition === "eastern");

/** First-sign-in sticker asking Eastern / Oriental / Inquirer; sets profile branch and app defaults. */
export function OrientationOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"family" | "oriental" | "eastern">("family");
  const [saving, setSaving] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(() => localStorage.getItem("hasSeenTutorial") === "true");

  useEffect(() => {
    const onDone = () => setTutorialDone(true);
    window.addEventListener("orthocross:tutorial-done", onDone);
    return () => window.removeEventListener("orthocross:tutorial-done", onDone);
  }, []);

  useEffect(() => {
    if (!user || !tutorialDone || localStorage.getItem(doneKey(user.id))) return;
    let cancelled = false;
    supabase.from("profile_identity_tags").select("branch").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (cancelled || error) return;
      if (data?.branch) {
        // Already chosen on another device: adopt it here without asking.
        localStorage.setItem(doneKey(user.id), "1");
        if (!hasStoredOrientation()) applyBranchPreferences(data.branch);
      } else { setStep("family"); setOpen(true); }
    });
    return () => { cancelled = true; };
  }, [user, tutorialDone]);

  const finish = () => { if (user) localStorage.setItem(doneKey(user.id), "1"); setOpen(false); };
  const chooseBranch = async (branch: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profile_identity_tags").upsert({ user_id: user.id, branch }, { onConflict: "user_id" });
    setSaving(false);
    if (!error) queryClient.invalidateQueries({ queryKey: ["profileIdentityTags", user.id] });
    applyBranchPreferences(branch);
    if (orientationForBranch(branch) === "undecided") setOrientation("undecided");
    finish();
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) finish(); }}>
      <DialogContent className="max-w-sm rounded-3xl text-center">
        {step === "family" ? <>
          <DialogTitle className="text-2xl">Welcome to OrthoCross</DialogTitle>
          <DialogDescription>
            <span className="inline-block text-left align-top">
              Which Orthodox tradition do you belong to?
              <br />
              We'll tailor the islands, saints and prayers to it.
            </span>
          </DialogDescription>
          <div className="flex flex-col gap-3 pt-2">
            <Button disabled={saving} className="profile-branch-eastern h-12 rounded-full" variant="ghost" onClick={() => setStep("eastern")}>Eastern</Button>
            <Button disabled={saving} className="profile-branch-oriental h-12 rounded-full" variant="ghost" onClick={() => setStep("oriental")}>Oriental</Button>
            <Button disabled={saving} className="profile-branch-unaffiliated h-12 rounded-full" variant="ghost" onClick={() => { setOrientation("undecided"); finish(); }}>Inquirer</Button>
          </div>
        </> : step === "eastern" ? <>
          <DialogTitle className="text-2xl">Which Eastern church?</DialogTitle>
          <DialogDescription>Your choice also sets your profile's Orthodox branch.</DialogDescription>
          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2">
            {EASTERN.map(b => <Button key={b.value} disabled={saving} variant="ghost" className="profile-branch-eastern h-11 rounded-full" onClick={() => void chooseBranch(b.value)}>{b.label}</Button>)}
            <Button variant="link" onClick={() => setStep("family")}>Back</Button>
          </div>
        </> : <>
          <DialogTitle className="text-2xl">Which Oriental church?</DialogTitle>
          <DialogDescription>Your choice also sets your profile's Orthodox branch.</DialogDescription>
          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2">
            {ORIENTAL.map(b => <Button key={b.value} disabled={saving} variant="ghost" className="profile-branch-oriental h-11 rounded-full" onClick={() => void chooseBranch(b.value)}>{b.label}</Button>)}
            <Button variant="link" onClick={() => setStep("family")}>Back</Button>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}
