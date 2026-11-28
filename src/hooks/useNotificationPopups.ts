import { useEffect } from "react";
import { toast } from "sonner";
import { notificationDuration, notificationText } from "@/lib/notificationPopups";

// The app also imports Sonner directly, so enforce the policy at its shared host.
export function useNotificationPopups() {
  useEffect(() => {
    const timers = new Map<string | number, { text: string; timer: ReturnType<typeof setTimeout> }>();
    const sync = () => {
      const active = toast.getToasts();
      const ids = new Set(active.map(({ id }) => id));
      for (const [id, entry] of timers) {
        if (!ids.has(id)) {
          clearTimeout(entry.timer);
          timers.delete(id);
        }
      }
      for (const item of active) {
        if ("dismiss" in item) continue;
        if (item.type === "loading") {
          const previous = timers.get(item.id);
          if (previous) clearTimeout(previous.timer);
          timers.delete(item.id);
          continue;
        }
        const text = [notificationText(item.title), notificationText(item.description)].filter(Boolean).join("\n");
        if (timers.get(item.id)?.text === text) continue;
        const previous = timers.get(item.id);
        if (previous) clearTimeout(previous.timer);
        timers.set(item.id, {
          text,
          timer: setTimeout(() => toast.dismiss(item.id), notificationDuration(text, document.documentElement.lang || "en")),
        });
        toast.message(item.title, { ...item, duration: Infinity, closeButton: false, dismissible: true });
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    sync();
    return () => {
      observer.disconnect();
      for (const { timer } of timers.values()) clearTimeout(timer);
    };
  }, []);
}