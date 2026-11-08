import { supabase } from "@/integrations/supabase/client";
import type { CalendarSystem } from "@/data/fastingEvents";
import type { CalendarTradition } from "@/lib/calendarTradition";
import { requestWidgetRefresh } from "@/lib/widgetBridge";

export interface SavedCalendarPreferences {
  calendarSystem: CalendarSystem;
  calendarTradition: CalendarTradition | null;
}

export const parseCalendarSystem = (value: unknown): CalendarSystem => (value === "Julian" ? "Julian" : "Gregorian");

export async function loadCalendarPreferences(accountId: string): Promise<SavedCalendarPreferences> {
  const { data, error } = await supabase.from("profiles")
    .select("calendar_system, calendar_tradition").eq("id", accountId).maybeSingle();
  if (error) throw error;
  const tradition = data?.calendar_tradition;
  return {
    calendarSystem: parseCalendarSystem(data?.calendar_system),
    calendarTradition: tradition === "Eastern Orthodox" || tradition === "Oriental Orthodox" ? tradition : null,
  };
}

/** Saves the reader's calendar choice to their account so widgets follow it on every device. */
export async function saveCalendarPreferences(accountId: string, changes: Partial<SavedCalendarPreferences>) {
  const update: { calendar_system?: CalendarSystem; calendar_tradition?: CalendarTradition } = {};
  if (changes.calendarSystem) update.calendar_system = changes.calendarSystem;
  if (changes.calendarTradition) update.calendar_tradition = changes.calendarTradition;
  if (!Object.keys(update).length) return;
  const { error } = await supabase.from("profiles").update(update).eq("id", accountId);
  if (error) {
    console.error("Could not save calendar preference", error);
    return;
  }
  requestWidgetRefresh();
}
