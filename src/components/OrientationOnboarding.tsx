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
import { orientationConfirmAction, type FamilyChoice } from "@/lib/orientationConfirm";
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
    // Ending the survey reveals the Board; it must open at the top, not at the restored middle.
    window.scrollTo(0, 0);
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
  return (
      <DialogContent className="max-w-sm rounded-3xl text-center">
        <OrientationStepsBody step={step} setStep={setStep} saving={saving} unaffiliatedLabel={unaffiliatedLabel} onChooseBranch={onChooseBranch} onNeither={onNeither} />
      </DialogContent>
  );
}

/** Lives inside DialogContent so pending selections clear whenever the dialog closes. */
function OrientationStepsBody({ step, setStep, saving, unaffiliatedLabel, onChooseBranch, onNeither }: {
  step: Step;
  setStep: (s: Step) => void;
  saving: boolean;
  unaffiliatedLabel: string;
  onChooseBranch: (branch: string) => void;
  onNeither: () => void;
}) {
  const { t, setLanguage } = useLanguage();
  const [familyChoice, setFamilyChoice] = useState<FamilyChoice | null>(null);
  const [churchChoice, setChurchChoice] = useState<string | null>(null);

  useEffect(() => { setChurchChoice(null); }, [step]);

  const confirm = () => {
    if (step === "language") { setStep("family"); return; }
    const action = orientationConfirmAction(step, familyChoice, churchChoice);
    if (!action) return;
    if (action.type === "step") setStep(action.step);
    else if (action.type === "neither") onNeither();
    else onChooseBranch(action.branch);
  };

  const confirmDisabled = saving || (step === "family" ? !familyChoice : step !== "language" && !churchChoice);
  const confirmButton = (
    <Button disabled={confirmDisabled} className="h-12 w-full rounded-full text-base" onClick={confirm}>{t("confirm")}</Button>
  );
  const familyButton = (choice: FamilyChoice, className: string, label: string) => (
    <Button disabled={saving} className={`${className} h-12 rounded-full`} variant="ghost" aria-pressed={familyChoice === choice} onClick={() => setFamilyChoice(choice)}>{label}</Button>
  );
  const churchList = (options: typeof EASTERN, className: string) => (
    <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto px-1 py-2">
      {options.map(b => <Button key={b.value} disabled={saving} variant="ghost" aria-pressed={churchChoice === b.value} className={`${className} h-11 shrink-0 rounded-full`} onClick={() => setChurchChoice(b.value)}>{b.label}</Button>)}
    </div>
  );

  return step === "language" ? <>
    <DialogTitle className="text-2xl">{t("chooseLanguage")}</DialogTitle>
    <DialogDescription>{t("languageNote")}</DialogDescription>
    <LanguageList onPick={l => setLanguage(l)} />
    {confirmButton}
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
      {familyButton("eastern", "profile-branch-eastern", t("eastern"))}
      {familyButton("oriental", "profile-branch-oriental", t("oriental"))}
      {familyButton("unaffiliated", "profile-branch-unaffiliated", unaffiliatedLabel)}
    </div>
    {confirmButton}
  </> : <>
    <DialogTitle className="text-2xl">{t(step === "eastern" ? "whichEastern" : "whichOriental")}</DialogTitle>
    <DialogDescription>{t("branchNote")}</DialogDescription>
    {churchList(step === "eastern" ? EASTERN : ORIENTAL, step === "eastern" ? "profile-branch-eastern" : "profile-branch-oriental")}
    {confirmButton}
    <Button variant="link" disabled={saving} onClick={() => setStep("family")}>{t("back")}</Button>
  </>;
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
