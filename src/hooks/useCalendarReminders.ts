import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notificationId } from "@/lib/calendarReminders";
import { toast } from "sonner";

export interface CalendarReminder {
  id: string; title: string; notes: string; event_date: string; remind_at: string;
}
async function nativeNotifications() {
  return Capacitor.isNativePlatform() ? LocalNotifications : null;
}
const toNotification = (r: CalendarReminder) => ({
  id: notificationId(r.id), title: r.title, body: r.notes || "Personal reminder", schedule: { at: new Date(r.remind_at) },
});
// Reminders saved on another device, or before this build, were never scheduled on this phone.
async function scheduleMissing(reminders: CalendarReminder[]) {
  if ((await LocalNotifications.checkPermissions()).display !== "granted") return;
  const { notifications: pending } = await LocalNotifications.getPending();
  const pendingIds = new Set(pending.map(n => n.id));
  const missing = reminders.filter(r => new Date(r.remind_at).getTime() > Date.now() && !pendingIds.has(notificationId(r.id)));
  if (missing.length) await LocalNotifications.schedule({ notifications: missing.map(toNotification) });
}
export function useCalendarReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["calendar-reminders", user?.id];
  const { data = [], error } = useQuery({
    queryKey, enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("calendar_reminders").select("id,title,notes,event_date,remind_at").eq("user_id", user.id).order("remind_at");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deliver = () => {
      const future = data.filter(r => new Date(r.remind_at).getTime() > Date.now());
      const due = data.filter(r => new Date(r.remind_at).getTime() <= Date.now() && new Date(r.remind_at).getTime() > Date.now() - 86400000);
      for (const r of due) {
        const key = `calendar-reminder-shown:${user.id}:${r.id}:${r.remind_at}`;
        if (!localStorage.getItem(key)) {
          toast(r.title, { description: r.notes || "Personal reminder", duration: 10000 });
          localStorage.setItem(key, "1");
        }
      }
      if (future.length) timer = setTimeout(deliver, Math.min(2147483647, Math.max(1000, new Date(future[0].remind_at).getTime() - Date.now())));
    };
    if (!Capacitor.isNativePlatform()) deliver();
    else scheduleMissing(data).catch(e => console.error("Calendar reminder sync", e));
    return () => { if (timer) clearTimeout(timer); };
  }, [data, user?.id]);

  const save = async (input: Omit<CalendarReminder, "id">, id?: string) => {
    if (!user) throw new Error("Sign in to save a reminder.");
    const row = { ...input, user_id: user.id };
    const request = id ? supabase.from("calendar_reminders").update(row).eq("id", id).eq("user_id", user.id) : supabase.from("calendar_reminders").insert(row);
    const { data: saved, error } = await request.select("id,title,notes,event_date,remind_at").single();
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey });
    try {
      const plugin = await nativeNotifications();
      if (plugin) {
        await plugin.cancel({ notifications: [{ id: notificationId(saved.id) }] });
        const permission = await plugin.requestPermissions();
        if (permission.display !== "granted") throw new Error("Notifications are disabled. Your reminder is saved; enable notifications in your phone settings.");
        await plugin.schedule({ notifications: [toNotification(saved)] });
      }
    } catch (e) { toast.warning(e instanceof Error ? e.message : "Reminder saved, but the phone notification could not be scheduled."); }
    return saved;
  };
  const remove = async (id: string) => {
    if (!user) throw new Error("Sign in to delete a reminder.");
    const { error } = await supabase.from("calendar_reminders").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey });
    try { const plugin = await nativeNotifications(); if (plugin) await plugin.cancel({ notifications: [{ id: notificationId(id) }] }); }
    catch { toast.warning("Reminder deleted. The phone notification could not be cleared."); }
  };
  return { reminders: data, error, save, remove };
}
