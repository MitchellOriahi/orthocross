// Pure builder for the home screen widget payload. No network or database
// access here, so the exact rules are unit-tested from the app's test suite.
import {
  observancesOnDate,
  primaryObservance,
  resolveCalendarTradition,
  resolveOrientalFamily,
  weeklyFastOnDate,
  type CalendarSystem,
  type DatedObservance,
} from "../_shared/orthodoxCalendar.ts";

export const WIDGET_PAYLOAD_VERSION = 1;
export const DEFAULT_TIMEZONE = "America/New_York";
const DAY_MS = 86_400_000;

export interface StreakRow {
  current_streak: number | null;
  longest_streak: number | null;
  last_activity_date: string | null;
  guardian_last_save_month: string | null;
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD for `instant` as seen on a wall clock in `timezone`. */
export function localDateIn(timezone: string, instant: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function tzOffsetMs(instant: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - instant;
}

const addDays = (dateKey: string, days: number) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
};

/** UTC instant at which the local calendar date `dateKey` begins in `timezone`. */
export function localMidnightUtc(dateKey: string, timezone: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let instant = guess - tzOffsetMs(guess, timezone);
  instant = guess - tzOffsetMs(instant, timezone);
  return instant;
}

/**
 * The streak the app will show on its next open. Mirrors the server streak
 * functions exactly (they count days in UTC): a missed day only resets the
 * stored number when the app opens, and a 7+ day streak gets one save a month.
 */
export function effectiveStreak(row: StreakRow | null, instant: number) {
  const today = new Date(instant).toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const stored = Math.max(0, row?.current_streak ?? 0);
  const longest = Math.max(stored, row?.longest_streak ?? 0);
  const base = { current: 0, longest, completedToday: false, atRisk: false, guardianSavePending: false, lastActivityDate: row?.last_activity_date ?? null };
  if (!row || !row.last_activity_date || stored === 0) return base;

  const diff = Math.round((Date.parse(today) - Date.parse(row.last_activity_date)) / DAY_MS);
  if (diff <= 0) return { ...base, current: stored, completedToday: true };
  if (diff === 1) return { ...base, current: stored, atRisk: true };
  if (stored >= 7 && row.guardian_last_save_month !== month) {
    return { ...base, current: stored, atRisk: true, guardianSavePending: true };
  }
  return base;
}

// ---- Appearance -------------------------------------------------------------

type Hsl = [number, number, number];

export function hslToHex([h, s, l]: Hsl): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

// HSL values copied from the app's theme tokens in src/index.css (:root and .dark)
// and the calendar's Tailwind text shades (exact hex), so widgets match the app in both modes.
const THEME = {
  light: {
    background: [0, 0, 100], card: [0, 0, 98], text: [0, 0, 0], secondaryText: [0, 0, 30], border: [0, 0, 85],
    streak: [29, 95, 49], streakInactive: [224, 18, 56],
    feast: [213, 97, 87], holiday: [48, 96, 76], fast: [0, 96, 89], weeklyFast: [269, 100, 95],
    feastText: "#1E3A8A", holidayText: "#78350F", fastText: "#7F1D1D", weeklyFastText: [0, 0, 0],
  },
  dark: {
    background: [0, 0, 0], card: [0, 0, 5], text: [0, 0, 100], secondaryText: [0, 0, 70], border: [0, 0, 20],
    streak: [29, 95, 49], streakInactive: [224, 18, 56],
    feast: [217, 71, 18], holiday: [24, 78, 13], fast: [0, 63, 16], weeklyFast: [274, 69, 7],
    feastText: "#DBEAFE", holidayText: "#FEF3C7", fastText: "#FEE2E2", weeklyFastText: [0, 0, 100],
  },
  tradition: { eastern: [217, 91, 60], oriental: [25, 95, 53] },
} satisfies Record<string, Record<string, Hsl | string>>;

const hexSet = (set: Record<string, Hsl | string>) =>
  Object.fromEntries(Object.entries(set).map(([k, v]) => [k, typeof v === "string" ? v : hslToHex(v)])) as Record<string, string>;

export function widgetAppearance(tradition: "Eastern Orthodox" | "Oriental Orthodox") {
  const accent = hslToHex(tradition === "Oriental Orthodox" ? THEME.tradition.oriental : THEME.tradition.eastern);
  return {
    light: { ...hexSet(THEME.light), traditionAccent: accent },
    dark: { ...hexSet(THEME.dark), traditionAccent: accent },
  };
}

// ---- Payload ----------------------------------------------------------------

export interface SnapshotInput {
  now: number;
  timezone: string | null | undefined;
  streak: StreakRow | null;
  verse: { reference: string; text: string } | null;
  branch: string | null | undefined;
  calendarTradition: string | null | undefined;
  orientalFamily?: string | null;
  calendarSystem: string | null | undefined;
}

const toObservance = (o: DatedObservance | null) => o && {
  name: o.name, category: o.category, kind: o.kind, isMajor: o.isMajor,
  startDate: o.startDate, endDate: o.endDate, dayOfPeriod: o.dayOfPeriod, totalDays: o.totalDays,
};

export function buildWidgetSnapshot(input: SnapshotInput) {
  const timezone = isValidTimeZone(input.timezone) ? input.timezone : DEFAULT_TIMEZONE;
  const localDate = localDateIn(timezone, input.now);
  const tradition = resolveCalendarTradition(input.branch, input.calendarTradition);
  const calendarSystem: CalendarSystem = input.calendarSystem === "Julian" ? "Julian" : "Gregorian";

  const family = resolveOrientalFamily(input.branch, input.orientalFamily);
  const events = observancesOnDate(localDate, tradition, calendarSystem, family);
  const weekly = weeklyFastOnDate(localDate);
  const primary = primaryObservance(events, weekly);

  const nextLocalMidnight = localMidnightUtc(addDays(localDate, 1), timezone);
  const utcToday = new Date(input.now).toISOString().slice(0, 10);
  const nextStreakDay = Date.parse(addDays(utcToday, 1));
  const refreshAfter = Math.min(nextLocalMidnight, nextStreakDay);

  return {
    version: WIDGET_PAYLOAD_VERSION,
    generatedAt: new Date(input.now).toISOString(),
    refreshAfter: new Date(refreshAfter).toISOString(),
    timezone,
    localDate,
    streak: { ...effectiveStreak(input.streak, input.now), dayEndsAt: new Date(nextStreakDay).toISOString() },
    verse: input.verse ? { reference: input.verse.reference, text: input.verse.text, date: localDate } : null,
    observance: {
      date: localDate,
      tradition,
      calendarSystem,
      primary: toObservance(primary),
      events: events.map(toObservance),
      weeklyFast: weekly !== null,
    },
    appearance: widgetAppearance(tradition),
  };
}

export type WidgetSnapshot = ReturnType<typeof buildWidgetSnapshot>;
