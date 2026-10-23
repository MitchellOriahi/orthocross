import type { OrthodoxOrientation } from "./orthodoxOrientation";

export type CalendarTradition = "Eastern Orthodox" | "Oriental Orthodox";
const preferenceKey = (accountId: string | undefined) => `calendar-tradition:${accountId ?? "guest"}`;

/** Undecided never replaces a calendar the reader already chose. */
export function calendarTraditionForOrientation(orientation: OrthodoxOrientation, previous: CalendarTradition): CalendarTradition {
  if (orientation === "eastern") return "Eastern Orthodox";
  if (orientation === "oriental") return "Oriental Orthodox";
  return previous;
}

export function readCalendarTradition(accountId: string | undefined): CalendarTradition {
  try {
    return localStorage.getItem(preferenceKey(accountId)) === "Oriental Orthodox" ? "Oriental Orthodox" : "Eastern Orthodox";
  } catch { return "Eastern Orthodox"; }
}

export function saveCalendarTradition(accountId: string | undefined, tradition: CalendarTradition) {
  try { localStorage.setItem(preferenceKey(accountId), tradition); } catch { /* Keep the current view when storage is unavailable. */ }
}