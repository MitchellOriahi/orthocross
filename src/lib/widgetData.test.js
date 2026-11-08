import { expect, test, describe } from "bun:test";
import {
  orthodoxPaschaUtc,
  easternMoveableFeasts,
  orientalMoveableFeasts,
  moveableFeastsEastern2025,
  moveableFeastsEastern2026,
  moveableFeastsOriental2025,
  moveableFeastsOriental2026,
  getAllFastingEvents,
  observancesOnDate,
  weeklyFastOnDate,
  primaryObservance,
  resolveCalendarTradition,
} from "../../supabase/functions/_shared/orthodoxCalendar.ts";
import { buildWidgetSnapshot, effectiveStreak, localDateIn, hslToHex } from "../../supabase/functions/widget-data/snapshot.ts";
import { generateWidgetToken, hashWidgetToken, isWidgetTokenShape } from "../../supabase/functions/_shared/widgetTokens.ts";
import { ORTHODOX_BRANCHES } from "../data/profileIdentity";
import { verseIndexForDate, SAMPLE_VERSES } from "./verseOfTheDay";

const iso = (utc) => new Date(utc).toISOString().slice(0, 10);
const byName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

describe("Orthodox Pascha", () => {
  test("matches published Orthodox Pascha dates", () => {
    const expected = {
      2025: "2025-04-20", 2026: "2026-04-12", 2027: "2027-05-02", 2028: "2028-04-16", 2029: "2029-04-08",
      2030: "2030-04-28", 2031: "2031-04-13", 2032: "2032-05-02", 2033: "2033-04-24", 2034: "2034-04-09", 2035: "2035-04-29",
    };
    for (const [year, date] of Object.entries(expected)) expect(iso(orthodoxPaschaUtc(Number(year)))).toBe(date);
  });

  test("Eastern offsets reproduce the app's 2025 list exactly", () => {
    expect(byName(easternMoveableFeasts(orthodoxPaschaUtc(2025)))).toEqual(byName(moveableFeastsEastern2025));
  });

  test("Eastern offsets reproduce the app's 2026 list except its Great Lent start", () => {
    const generated = byName(easternMoveableFeasts(orthodoxPaschaUtc(2026))).filter((e) => e.name !== "Great Lent");
    expect(generated).toEqual(byName(moveableFeastsEastern2026).filter((e) => e.name !== "Great Lent"));
  });

  test("Oriental offsets reproduce the app's 2025 and 2026 lists from their own Pascha dates", () => {
    expect(byName(orientalMoveableFeasts(Date.UTC(2025, 3, 13)))).toEqual(byName(moveableFeastsOriental2025));
    expect(byName(orientalMoveableFeasts(Date.UTC(2026, 3, 5)))).toEqual(byName(moveableFeastsOriental2026));
  });

  test("2025 and 2026 calendar lists are unchanged; 2027 gains moveable feasts", () => {
    const names2026 = getAllFastingEvents(2026).filter((e) => e.isMoveable);
    expect(names2026).toEqual([...moveableFeastsEastern2026, ...moveableFeastsOriental2026]);
    const pascha2027 = getAllFastingEvents(2027).filter((e) => e.name === "Pascha (Easter)");
    expect(pascha2027.map((e) => [e.tradition, e.month, e.day])).toEqual([["Eastern", 4, 2], ["Oriental", 4, 2]]);
  });
});

describe("today's observance", () => {
  test("Nativity of Christ on Dec 25 (New Calendar) and Jan 7 (Old Calendar)", () => {
    expect(observancesOnDate("2026-12-25", "Eastern Orthodox")[0]).toMatchObject({ name: "Nativity of Christ", category: "feast" });
    expect(observancesOnDate("2027-01-07", "Eastern Orthodox", "Julian")[0]).toMatchObject({ name: "Nativity of Christ", category: "feast" });
  });

  test("periods report their day and length", () => {
    expect(observancesOnDate("2026-11-20", "Eastern Orthodox")[0]).toMatchObject({ name: "Nativity Fast", category: "fast", dayOfPeriod: 6, totalDays: 40 });
  });

  test("a fast that started last year still counts in January", () => {
    expect(observancesOnDate("2027-01-03", "Oriental Orthodox")[0]).toMatchObject({ name: "Nativity Fast (Advent)", startDate: "2026-11-25", endDate: "2027-01-06" });
  });

  test("Great Lent 2027 begins on Clean Monday, March 15", () => {
    expect(observancesOnDate("2027-03-15", "Eastern Orthodox")[0]).toMatchObject({ name: "Great Lent", dayOfPeriod: 1 });
    expect(observancesOnDate("2027-03-14", "Eastern Orthodox").some((o) => o.name === "Great Lent")).toBe(false);
  });

  test("priority is feast, then holiday, then fast, then Wednesday/Friday", () => {
    const nicholas = observancesOnDate("2026-12-06", "Eastern Orthodox");
    expect(primaryObservance(nicholas, weeklyFastOnDate("2026-12-06"))).toMatchObject({ name: "St. Nicholas", category: "holiday" });
    expect(primaryObservance(observancesOnDate("2026-11-11", "Eastern Orthodox"), weeklyFastOnDate("2026-11-11"))).toMatchObject({ name: "Wednesday Fast", kind: "weekly" });
    expect(weeklyFastOnDate("2026-11-08")).toBe(null);
  });

  test("tradition follows the chosen church, then the saved calendar pick", () => {
    for (const branch of ORTHODOX_BRANCHES) {
      const expected = branch.tradition === "oriental" ? "Oriental Orthodox" : branch.tradition === "eastern" ? "Eastern Orthodox" : "Oriental Orthodox";
      expect(resolveCalendarTradition(branch.value, "Oriental Orthodox")).toBe(expected);
    }
    expect(resolveCalendarTradition(null, null)).toBe("Eastern Orthodox");
  });
});

describe("streak shown on widgets", () => {
  const at = Date.parse("2026-11-08T15:00:00Z");
  const row = (last, current = 5, saveMonth = null) => ({ current_streak: current, longest_streak: 9, last_activity_date: last, guardian_last_save_month: saveMonth });

  test("today or yesterday keeps the streak", () => {
    expect(effectiveStreak(row("2026-11-08"), at)).toMatchObject({ current: 5, completedToday: true, atRisk: false });
    expect(effectiveStreak(row("2026-11-07"), at)).toMatchObject({ current: 5, completedToday: false, atRisk: true });
  });

  test("a missed day shows 0 unless the monthly save will apply", () => {
    expect(effectiveStreak(row("2026-11-05", 5), at).current).toBe(0);
    expect(effectiveStreak(row("2026-11-05", 7), at)).toMatchObject({ current: 7, guardianSavePending: true });
    expect(effectiveStreak(row("2026-11-05", 7, "2026-11"), at).current).toBe(0);
    expect(effectiveStreak(null, at).current).toBe(0);
  });
});

describe("snapshot", () => {
  const base = { streak: null, verse: { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." }, branch: null, calendarTradition: null, calendarSystem: null };

  test("uses the account's local date", () => {
    const instant = Date.parse("2026-11-09T03:00:00Z");
    expect(localDateIn("America/New_York", instant)).toBe("2026-11-08");
    expect(localDateIn("Asia/Tokyo", instant)).toBe("2026-11-09");
    const snap = buildWidgetSnapshot({ ...base, now: instant, timezone: "Asia/Tokyo" });
    expect(snap.localDate).toBe("2026-11-09");
    expect(snap.verse.text).toBe("The Lord is my shepherd; I shall not want.");
  });

  test("falls back to New York for a missing or invalid time zone", () => {
    expect(buildWidgetSnapshot({ ...base, now: Date.now(), timezone: "Mars/Olympus" }).timezone).toBe("America/New_York");
  });

  test("refreshes at the earlier of local midnight and the streak day change", () => {
    const snap = buildWidgetSnapshot({ ...base, now: Date.parse("2026-11-08T22:00:00Z"), timezone: "America/New_York" });
    expect(snap.refreshAfter).toBe("2026-11-09T00:00:00.000Z");
    expect(snap.streak.dayEndsAt).toBe("2026-11-09T00:00:00.000Z");
    const ny = buildWidgetSnapshot({ ...base, now: Date.parse("2026-11-09T01:00:00Z"), timezone: "America/New_York" });
    expect(ny.refreshAfter).toBe("2026-11-09T05:00:00.000Z");
  });

  test("provides light and dark colors from the app theme", () => {
    const { appearance } = buildWidgetSnapshot({ ...base, now: Date.now(), timezone: "UTC", calendarTradition: "Oriental Orthodox" });
    expect(appearance.light.background).toBe("#FFFFFF");
    expect(appearance.dark.background).toBe("#000000");
    expect(appearance.light.feastText).toBe("#1E3A8A");
    expect(appearance.dark.traditionAccent).toBe(hslToHex([25, 95, 53]));
  });

  test("the Old Calendar choice is honored", () => {
    const snap = buildWidgetSnapshot({ ...base, now: Date.parse("2027-01-07T12:00:00Z"), timezone: "UTC", calendarSystem: "Julian" });
    expect(snap.observance).toMatchObject({ calendarSystem: "Julian", tradition: "Eastern Orthodox" });
    expect(snap.observance.primary).toMatchObject({ name: "Nativity of Christ", category: "feast" });
  });
});

test("dashboard verse rotation matches the backend rotation", () => {
  expect(SAMPLE_VERSES[verseIndexForDate("2026-01-01")].reference).toBe("John 3:16");
  expect(SAMPLE_VERSES[verseIndexForDate("2026-11-08")].reference).toBe("Jeremiah 29:11");
  expect(SAMPLE_VERSES[verseIndexForDate("2026-11-09")].reference).toBe("John 3:16");
});

test("widget keys are random, well-formed and stored only as hashes", async () => {
  const a = generateWidgetToken();
  const b = generateWidgetToken();
  expect(isWidgetTokenShape(a)).toBe(true);
  expect(a).not.toBe(b);
  const hash = await hashWidgetToken(a);
  expect(hash).toMatch(/^[0-9a-f]{64}$/);
  expect(hash).not.toContain(a.slice(4));
  expect(isWidgetTokenShape("eyJhbGciOi.not-a-widget-key")).toBe(false);
});
