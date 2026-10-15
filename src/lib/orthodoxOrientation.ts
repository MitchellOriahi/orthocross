import { useSyncExternalStore } from "react";
import { getBranchTradition, ORTHODOX_BRANCHES } from "@/data/profileIdentity";
import { hasManualCategoryIconStyle, setCategoryIconStyle, type CategoryIconStyle } from "@/hooks/useCategoryIconStyle";

export type OrthodoxOrientation = "eastern" | "oriental" | "undecided";
export const ORIENTATION_LABELS: Record<OrthodoxOrientation, string> = { eastern: "Eastern", oriental: "Oriental", undecided: "Neither" };
export const ORIENTATION_SIGNUP_METADATA = { orientation_onboarding_status: "pending" } as const;
export function shouldShowOrientationOnboarding(metadata: Record<string, unknown> | undefined, locallyCompleted: boolean) {
  return !locallyCompleted && metadata?.orientation_onboarding_status !== "completed";
}
export function orientationChurchOptions(tradition: "eastern" | "oriental") {
  return ORTHODOX_BRANCHES
    .filter(branch => branch.tradition === tradition && branch.value !== "Eastern Orthodox" && branch.value !== "Oriental Orthodox")
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}
const KEY = "orthodox-orientation";
const EVENT = "orthodox-orientation-change";

export function parseOrientation(value: string | null): OrthodoxOrientation {
  return value === "eastern" || value === "oriental" ? value : "undecided";
}
/** Tradition filter used by Saints and Prayers ("all" when undecided). */
export function orientationFilter(o: OrthodoxOrientation): "all" | "Eastern" | "Oriental" {
  return o === "eastern" ? "Eastern" : o === "oriental" ? "Oriental" : "all";
}
export function orientationForBranch(branch: string | null | undefined): OrthodoxOrientation {
  const t = getBranchTradition(branch);
  return t === "unaffiliated" ? "undecided" : t;
}
/** Icon style implied by a branch; null leaves the current style untouched. */
export function iconStyleForBranch(branch: string | null | undefined): CategoryIconStyle | null {
  switch (branch) {
    case "Coptic": return "coptic";
    case "Ethiopian Tewahedo": case "Eritrean Tewahedo": return "tewahedo";
    case "Russian Orthodox": return "byzantine";
    case "Greek Orthodox": return "original";
    default: return null;
  }
}

let current: OrthodoxOrientation = "undecided";
try { current = parseOrientation(localStorage.getItem(KEY)); } catch { /* storage unavailable */ }
export function hasStoredOrientation() {
  try { return localStorage.getItem(KEY) !== null; } catch { return false; }
}
export function getOrientation() { return current; }
export function setOrientation(value: OrthodoxOrientation) {
  current = value;
  try { localStorage.setItem(KEY, value); } catch { /* keep in memory */ }
  window.dispatchEvent(new Event(EVENT));
}
/** Apply a profile branch choice: orientation follows its family; icons follow known churches unless the user picked a style themselves. */
export function applyBranchPreferences(branch: string | null | undefined) {
  setOrientation(orientationForBranch(branch));
  const style = iconStyleForBranch(branch);
  if (style && !hasManualCategoryIconStyle()) setCategoryIconStyle(style);
}
function subscribe(listener: () => void) {
  const storage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) { current = parseOrientation(e.newValue); listener(); } };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", storage); };
}
export function useOrthodoxOrientation() {
  return useSyncExternalStore(subscribe, () => current, () => "undecided" as const);
}
