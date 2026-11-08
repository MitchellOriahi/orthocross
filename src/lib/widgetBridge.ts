// Bridge between the app and the native iOS home screen widgets.
// The widgets themselves are built natively (WidgetKit) and read from a shared
// App Group. This file only hands them a read-only widget key and a fresh
// snapshot. Everything here does nothing on the web or when the native
// `OrthoCrossWidget` plugin is not part of the installed build.
import { supabase } from "@/integrations/supabase/client";

export const WIDGET_REFRESH_EVENT = "orthocross:widget-refresh";

export interface OrthoCrossWidgetPlugin {
  /** Store the read-only key and data URL in the shared App Group keychain. */
  setCredentials(options: { token: string; endpoint: string }): Promise<void>;
  /** Currently stored key, if any (used to revoke it on sign-out). */
  getCredentials(): Promise<{ token: string | null; endpoint: string | null }>;
  /** Write the latest snapshot JSON so widgets can render instantly without a network call. */
  saveSnapshot(options: { json: string }): Promise<void>;
  /** WidgetCenter.shared.reloadAllTimelines() */
  reloadTimelines(): Promise<void>;
  /** Remove the key and snapshot (sign-out / account deletion). */
  clear(): Promise<void>;
}

let pluginPromise: Promise<OrthoCrossWidgetPlugin | null> | null = null;

async function widgetPlugin(): Promise<OrthoCrossWidgetPlugin | null> {
  pluginPromise ??= (async () => {
    try {
      const { Capacitor, registerPlugin } = await import("@capacitor/core");
      if (Capacitor.getPlatform() !== "ios" || !Capacitor.isPluginAvailable("OrthoCrossWidget")) return null;
      return registerPlugin<OrthoCrossWidgetPlugin>("OrthoCrossWidget");
    } catch {
      return null;
    }
  })();
  return pluginPromise;
}

let syncing: Promise<void> | null = null;

/** Make sure this device has a widget key, then push a fresh snapshot to the widgets. */
export function syncWidgets(): Promise<void> {
  syncing ??= (async () => {
    const plugin = await widgetPlugin();
    if (!plugin) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const stored = await plugin.getCredentials().catch(() => ({ token: null, endpoint: null }));
    if (!stored.token) {
      const { data, error } = await supabase.functions.invoke("widget-token", { body: { action: "issue", label: "iOS widget" } });
      if (error || !data?.token) throw error ?? new Error("No widget key returned");
      await plugin.setCredentials({ token: data.token, endpoint: data.endpoint });
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data: snapshot, error } = await supabase.functions.invoke("widget-data", { body: { timezone } });
    if (error || !snapshot) throw error ?? new Error("No widget data returned");
    await plugin.saveSnapshot({ json: JSON.stringify(snapshot) });
    await plugin.reloadTimelines();
  })()
    .catch((error) => console.warn("Widget sync skipped", error))
    .finally(() => { syncing = null; });
  return syncing;
}

/** Revoke this device's widget key and clear the widgets. Never blocks sign-out for long. */
export async function disconnectWidgets(): Promise<void> {
  const plugin = await widgetPlugin();
  if (!plugin) return;
  const work = (async () => {
    const { token } = await plugin.getCredentials().catch(() => ({ token: null }));
    if (token) await supabase.functions.invoke("widget-token", { body: { action: "revoke", token } }).catch(() => undefined);
    await plugin.clear();
    await plugin.reloadTimelines();
  })().catch((error) => console.warn("Widget disconnect incomplete", error));
  await Promise.race([work, new Promise((resolve) => setTimeout(resolve, 3000))]);
}

/** Ask any mounted widget sync to refresh (streak or calendar changed). */
export function requestWidgetRefresh() {
  try { window.dispatchEvent(new Event(WIDGET_REFRESH_EVENT)); } catch { /* not in a browser */ }
}
