import { describe, expect, test } from "bun:test";
import { SAMPLE_VERSES, verseIndexForDate, getVerseOfTheDay } from "./verseOfTheDay";

const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

describe("verse of the day", () => {
  test("a different verse every day for a whole year, including leap years", () => {
    for (const start of ["2026-01-01", "2026-11-22", "2028-01-01"]) {
      const seen = new Set();
      for (let i = 0; i < 366; i++) seen.add(SAMPLE_VERSES[verseIndexForDate(addDays(start, i))].reference);
      expect(seen.size).toBe(366);
    }
  });

  test("every verse in the list is distinct and complete", () => {
    expect(new Set(SAMPLE_VERSES.map((v) => v.reference)).size).toBe(SAMPLE_VERSES.length);
    for (const v of SAMPLE_VERSES) expect(v.text.trim()).toMatch(/[.!?]$/);
  });

  test("the cycle no longer repeats after 8 days", () => {
    expect(getVerseOfTheDay(new Date(2026, 10, 22)).reference).not.toBe(getVerseOfTheDay(new Date(2026, 10, 30)).reference);
  });
});
