import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WIDGET_REFRESH_EVENT, syncWidgets } from "@/lib/widgetBridge";

/** Keeps iOS home screen widgets current: on sign-in, on return to the app, and after streak/calendar changes. */
export function useWidgetSync() {
  const { user } = useAuth();
  const accountId = user?.id;

  useEffect(() => {
    if (!accountId) return;
    let removeResume: (() => void) | undefined;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => void syncWidgets(), 400);
    };

    refresh();
    window.addEventListener(WIDGET_REFRESH_EVENT, refresh);
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.getPlatform() !== "ios") return;
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => { if (isActive) refresh(); });
        removeResume = () => void handle.remove();
      } catch { /* app plugin unavailable */ }
    })();

    return () => {
      clearTimeout(debounce);
      window.removeEventListener(WIDGET_REFRESH_EVENT, refresh);
      removeResume?.();
    };
  }, [accountId]);
}

export const WidgetSync = () => {
  useWidgetSync();
  return null;
};
