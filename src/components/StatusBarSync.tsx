import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

// Keeps the native iOS status bar overlaying the edge-to-edge webview and its
// text color matched to the app theme (Style.Dark = light text on dark bg).
export const StatusBarSync = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setStyle({ style: resolvedTheme === "dark" ? Style.Dark : Style.Light }).catch(() => {});
  }, [resolvedTheme]);

  return null;
};
