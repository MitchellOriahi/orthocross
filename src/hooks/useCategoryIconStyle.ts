import { useSyncExternalStore } from "react";

export const CATEGORY_ICON_STYLES = ["original", "tewahedo", "coptic", "byzantine"] as const;
export type CategoryIconStyle = typeof CATEGORY_ICON_STYLES[number];
export const CATEGORY_ICON_STYLE_LABELS: Record<CategoryIconStyle, string> = {
  original: "Greek", tewahedo: "Tewahedo", coptic: "Coptic", byzantine: "Russian",
};
const KEY = "category-icon-style";
const MANUAL_KEY = "category-icon-style-manual";
const EVENT = "category-icon-style-change";
export function parseCategoryIconStyle(value: string | null): CategoryIconStyle {
  return CATEGORY_ICON_STYLES.find(style => style === value) ?? "original";
}
let current: CategoryIconStyle = "original";
try { current = parseCategoryIconStyle(localStorage.getItem(KEY)); } catch { /* Storage can be unavailable. */ }
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    current = parseCategoryIconStyle(event.newValue);
    listener();
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", storage); };
}
export function setCategoryIconStyle(value: string, options?: { manual?: boolean }) {
  current = parseCategoryIconStyle(value);
  try {
    localStorage.setItem(KEY, current);
    if (options?.manual) localStorage.setItem(MANUAL_KEY, "true");
  } catch { /* Retain the in-memory choice. */ }
  window.dispatchEvent(new Event(EVENT));
}
/** True once the user has picked an icon style themselves; automatic branch defaults must then leave it alone. */
export function hasManualCategoryIconStyle() {
  try { return localStorage.getItem(MANUAL_KEY) === "true"; } catch { return false; }
}
export function useCategoryIconStyle() {
  const style = useSyncExternalStore(subscribe, () => current, () => "original" as const);
  return { style, setStyle: setCategoryIconStyle };
}