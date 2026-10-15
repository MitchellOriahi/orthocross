import { useSyncExternalStore } from "react";

export const CATEGORY_ICON_STYLES = ["original", "tewahedo", "coptic", "byzantine"] as const;
export type CategoryIconStyle = typeof CATEGORY_ICON_STYLES[number];
export const CATEGORY_ICON_STYLE_LABELS: Record<CategoryIconStyle, string> = {
  original: "Greek", tewahedo: "Tewahedo", coptic: "Coptic", byzantine: "Russian",
};

/** Saints and Prayers each keep their own icon style: a pick in one section never moves the other. */
export const CATEGORY_ICON_SCOPES = ["saints", "prayers"] as const;
export type CategoryIconScope = typeof CATEGORY_ICON_SCOPES[number];

const KEY = "category-icon-style";
const MANUAL_KEY = "category-icon-style-manual";
const EVENT = "category-icon-style-change";
const styleKey = (scope: CategoryIconScope) => `${KEY}:${scope}`;
const manualKey = (scope: CategoryIconScope) => `${MANUAL_KEY}:${scope}`;

export function parseCategoryIconStyle(value: string | null): CategoryIconStyle {
  return CATEGORY_ICON_STYLES.find(style => style === value) ?? "original";
}

function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Keep the stored choice. */ } }

/** A section that was never chosen on its own keeps the style picked before the sections were separated. */
function adoptLegacyChoice(scope: CategoryIconScope) {
  if (read(styleKey(scope)) !== null) return;
  const legacy = read(KEY);
  if (legacy === null) return;
  write(styleKey(scope), legacy);
  if (read(MANUAL_KEY) === "true") write(manualKey(scope), "true");
}

export function getCategoryIconStyle(scope: CategoryIconScope): CategoryIconStyle {
  adoptLegacyChoice(scope);
  return parseCategoryIconStyle(read(styleKey(scope)));
}

export function setCategoryIconStyle(scope: CategoryIconScope, value: string, options?: { manual?: boolean }) {
  adoptLegacyChoice(scope);
  const style = parseCategoryIconStyle(value);
  write(styleKey(scope), style);
  if (options?.manual) write(manualKey(scope), "true");
  try { window.dispatchEvent(new Event(`${EVENT}:${scope}`)); } catch { /* No window: the stored choice still stands. */ }
}

/** True once the user has picked this section's style themselves; automatic branch defaults must then leave it alone. */
export function hasManualCategoryIconStyle(scope: CategoryIconScope) {
  adoptLegacyChoice(scope);
  return read(manualKey(scope)) === "true";
}

function subscribe(scope: CategoryIconScope, listener: () => void) {
  const event = `${EVENT}:${scope}`;
  const storage = (event: StorageEvent) => {
    if (event.key !== styleKey(scope) && event.key !== null) return;
    listener();
  };
  window.addEventListener(event, listener);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(event, listener); window.removeEventListener("storage", storage); };
}

export function useCategoryIconStyle(scope: CategoryIconScope) {
  const style = useSyncExternalStore(
    listener => subscribe(scope, listener),
    () => getCategoryIconStyle(scope),
    () => "original" as const,
  );
  return { style, setStyle: (value: string, options?: { manual?: boolean }) => setCategoryIconStyle(scope, value, options) };
}
