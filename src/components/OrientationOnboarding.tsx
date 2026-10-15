import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { applyBranchPreferences, hasStoredOrientation, orientationForBranch, setOrientation, orientationChurchOptions, shouldShowOrientationOnboarding } from "@/lib/orthodoxOrientation";

const doneKey = (id: string) => `orientation-onboarded:${id}`;
const ORIENTAL = orientationChurchOptions("oriental");
const EASTERN = orientationChurchOptions("eastern");

/** One-time sticker, including unseen existing accounts; completion follows the account. */
export function OrientationOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
      if (data?.branch && !hasStoredOrientation()) applyBranchPreferences(data.branch);
      // A saved branch is not evidence that this account has seen the sticker.
      if (shouldShowOrientationOnboarding(user.user_metadata, false)) { setStep("family"); setOpen(true); }
    });
    return () => { cancelled = true; };
  }, [user, tutorialDone]);

  const finish = async () => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { orientation_onboarding_status: "completed" } });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save your choice", description: "Please try again.", variant: "destructive" });
      return;
    }
    localStorage.setItem(doneKey(user.id), "1");
    toast({ title: "Profile updated!", description: "Your Orthodox tradition now shows on your profile in the Friends section." });
    setOpen(false);
  };
  const chooseBranch = async (branch: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profile_identity_tags").upsert({ user_id: user.id, branch }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save your church", description: "Please try again.", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profileIdentityTags", user.id] });
    applyBranchPreferences(branch);
    if (orientationForBranch(branch) === "undecided") setOrientation("undecided");
    await finish();
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) void finish(); }}>
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
            <Button disabled={saving} className="profile-branch-unaffiliated h-12 rounded-full" variant="ghost" onClick={() => { setOrientation("undecided"); void finish(); }}>Neither</Button>
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
