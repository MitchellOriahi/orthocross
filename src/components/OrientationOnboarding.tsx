import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageList } from "@/components/LanguageButton";
import { PROFILE_UPDATED_TOAST } from "@/lib/profileToast";
import { submitOrientationChoice } from "@/lib/orientationSubmission";
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
  const submitting = useRef(false);
  const accountId = user?.id;

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
    if (!user || localStorage.getItem(doneKey(user.id))) return;
    // Open the language step immediately so the Board never shows first.
    const initialStep = initialOrientationOnboardingStep(user.user_metadata, false);
    if (initialStep) { setStep(initialStep); setOpen(true); (window as any).__orientationOpen = true; }
    let cancelled = false;
    supabase.from("profile_identity_tags").select("branch").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (cancelled || error) return;
      if (data?.branch && !hasStoredOrientation()) applyBranchPreferences(data.branch);
    });
    return () => { cancelled = true; };
  // Token refreshes and updateUser replace the user object; they must not reset an active survey.
  }, [accountId]);

  useEffect(() => {
    if (open) return;
    (window as any).__orientationOpen = false;
    window.dispatchEvent(new Event("orthocross:orientation-done"));
  }, [open]);

  /** Persist completion; silent when the sticker is dismissed without choosing, so no toast is shown. */
  const finish = async (silent = false, branch?: string) => {
    if (!user || submitting.current) return;
    submitting.current = true;
    try {
      await submitOrientationChoice({
        saveBranch: branch ? () => supabase.from("profile_identity_tags").upsert({ user_id: user.id, branch }, { onConflict: "user_id" }) : undefined,
        saveCompletion: () => supabase.auth.updateUser({ data: { orientation_onboarding_status: "completed" } }),
        setSaving,
        onComplete: () => {
          if (branch) {
            void queryClient.invalidateQueries({ queryKey: ["profileIdentityTags", user.id] });
            applyBranchPreferences(branch, { force: true });
          } else if (!silent) setOrientation("undecided");
          // Account metadata is authoritative; unavailable browser storage must not trap the user.
          try { localStorage.setItem(doneKey(user.id), "1"); } catch { /* completion is already saved */ }
          setOpen(false);
          if (!silent) toast(PROFILE_UPDATED_TOAST);
        },
      });
    } catch {
      toast({ title: "Couldn't save your choice", description: "Please try again.", variant: "destructive" });
    } finally {
      submitting.current = false;
    }
  };
  const chooseBranch = (branch: string) => finish(false, branch);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) void finish(true); }}>
      <OrientationSteps step={step} setStep={setStep} saving={saving} unaffiliatedLabel={t("justExploring")} onChooseBranch={chooseBranch} onNeither={() => void finish()} />
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
