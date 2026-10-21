import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageList } from "@/components/LanguageButton";
import { PROFILE_UPDATED_TOAST } from "@/lib/profileToast";
import { applyBranchPreferences, applyLanguageIconDefaults, hasStoredOrientation, orientationForBranch, setOrientation, orientationChurchOptions, initialOrientationOnboardingStep } from "@/lib/orthodoxOrientation";

type Step = "language" | "family" | "oriental" | "eastern";
const doneKey = (id: string) => `orientation-onboarded:${id}`;
const ORIENTAL = orientationChurchOptions("oriental");
const EASTERN = orientationChurchOptions("eastern");

/** One-time sticker, including unseen existing accounts; completion follows the account. */
export function OrientationOnboarding() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("family");
  const [saving, setSaving] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(() => localStorage.getItem("hasSeenTutorial") === "true");

  const { data: identity, isSuccess: identityLoaded } = useQuery({
    queryKey: ["profileIdentityTags", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profile_identity_tags")
        .select("branch, patron_saint_id, country_code, age").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  useEffect(() => {
    if (user && identityLoaded) applyLanguageIconDefaults(language, identity?.branch);
  }, [user?.id, identityLoaded, identity?.branch, language]);

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
      const initialStep = initialOrientationOnboardingStep(user.user_metadata, false);
      if (initialStep) { setStep(initialStep); setOpen(true); }
    });
    return () => { cancelled = true; };
  }, [user, tutorialDone]);

  /** Persist completion; silent when the sticker is dismissed without choosing, so no toast is shown. */
  const finish = async (silent = false) => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { orientation_onboarding_status: "completed" } });
    setSaving(false);
    if (error) {
      if (!silent) toast({ title: "Couldn't save your choice", description: "Please try again.", variant: "destructive" });
      return;
    }
    localStorage.setItem(doneKey(user.id), "1");
    if (!silent) toast(PROFILE_UPDATED_TOAST);
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
    applyBranchPreferences(branch, { force: true });
    if (orientationForBranch(branch) === "undecided") setOrientation("undecided");
    await finish();
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) void finish(true); }}>
      <OrientationSteps step={step} setStep={setStep} saving={saving} unaffiliatedLabel={t("justExploring")} onChooseBranch={chooseBranch} onNeither={() => { setOrientation("undecided"); void finish(); }} />
    </Dialog>
  );
}

function OrientationSteps({ step, setStep, saving, unaffiliatedLabel, onChooseBranch, onNeither }: {
  step: Step;
  setStep: (s: Step) => void;
  saving: boolean;
  /** Wording of the grey third choice: "Just Exploring" in the first-open survey, "Neither" in Settings. */
  unaffiliatedLabel: string;
  onChooseBranch: (branch: string) => void;
  onNeither: () => void;
}) {
  const { t, setLanguage } = useLanguage();
  return (
      <DialogContent className="max-w-sm rounded-3xl text-center">
        {step === "language" ? <>
          <DialogTitle className="text-2xl">{t("chooseLanguage")}</DialogTitle>
          <DialogDescription>{t("languageNote")}</DialogDescription>
          <LanguageList onPick={l => { setLanguage(l); setStep("family"); }} />
        </> : step === "family" ? <>
          <DialogTitle className="text-2xl">{t("welcome")}</DialogTitle>
          <DialogDescription>
            <span className="inline-block text-left align-top">
              {t("traditionQ")}
              <br />
              {t("traditionNote")}
            </span>
          </DialogDescription>
          <div className="flex flex-col gap-3 pt-2">
            <Button disabled={saving} className="profile-branch-eastern h-12 rounded-full" variant="ghost" onClick={() => setStep("eastern")}>{t("eastern")}</Button>
            <Button disabled={saving} className="profile-branch-oriental h-12 rounded-full" variant="ghost" onClick={() => setStep("oriental")}>{t("oriental")}</Button>
            <Button disabled={saving} className="profile-branch-unaffiliated h-12 rounded-full" variant="ghost" onClick={onNeither}>{unaffiliatedLabel}</Button>
          </div>
        </> : step === "eastern" ? <>
          <DialogTitle className="text-2xl">{t("whichEastern")}</DialogTitle>
          <DialogDescription>{t("branchNote")}</DialogDescription>
          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2">
            {EASTERN.map(b => <Button key={b.value} disabled={saving} variant="ghost" className="profile-branch-eastern h-11 rounded-full" onClick={() => onChooseBranch(b.value)}>{b.label}</Button>)}
            <Button variant="link" onClick={() => setStep("family")}>{t("back")}</Button>
          </div>
        </> : <>
          <DialogTitle className="text-2xl">{t("whichOriental")}</DialogTitle>
          <DialogDescription>{t("branchNote")}</DialogDescription>
          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2">
            {ORIENTAL.map(b => <Button key={b.value} disabled={saving} variant="ghost" className="profile-branch-oriental h-11 rounded-full" onClick={() => onChooseBranch(b.value)}>{b.label}</Button>)}
            <Button variant="link" onClick={() => setStep("family")}>{t("back")}</Button>
          </div>
        </>}
      </DialogContent>
  );
}

/** Settings-driven chooser: re-opens the tradition/church menus on demand; "Neither" clears the profile branch. */
export function TraditionChoiceDialog({ open, initialStep, onClose }: {
  open: boolean;
  initialStep: Step;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();
  const [step, setStep] = useState(initialStep);

  useEffect(() => { if (open) setStep(initialStep); }, [open, initialStep]);

  const clearBranch = async () => {
    if (!user) return;
    const { error } = await supabase.from("profile_identity_tags").upsert({ user_id: user.id, branch: null }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Couldn't update your profile", description: "Please try again.", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profileIdentityTags", user.id] });
  };

  const chooseBranch = async (branch: string) => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase.from("profile_identity_tags").upsert({ user_id: user.id, branch }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save your church", description: "Please try again.", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profileIdentityTags", user.id] });
    applyBranchPreferences(branch, { force: true });
    toast(PROFILE_UPDATED_TOAST);
    onClose();
  };

  const chooseNeither = async () => {
    setOrientation("undecided");
    await clearBranch();
    toast(PROFILE_UPDATED_TOAST);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <OrientationSteps step={step} setStep={setStep} saving={saving} unaffiliatedLabel={t("neither")} onChooseBranch={chooseBranch} onNeither={() => void chooseNeither()} />
    </Dialog>
  );
}
