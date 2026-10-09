import { describe, expect, test } from "bun:test";
import { dailyVerseArtwork, VERSE_PHOTO_CYCLE_DAYS } from "./verseImageStyles";

const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

describe("daily verse photos", () => {
  test("three photos a day, one per category, stable within the day", () => {
    const today = dailyVerseArtwork("2026-10-09");
    expect(today).toHaveLength(3);
    expect(today.map(s => s.treatment)).toEqual(["golden", "pilgrim", "midnight"]);
    expect(dailyVerseArtwork("2026-10-09")).toEqual(today);
  });
  test("no photo repeats across the whole cycle", () => {
    expect(VERSE_PHOTO_CYCLE_DAYS).toBeGreaterThanOrEqual(100);
    const seen = new Set();
    for (let i = 0; i < VERSE_PHOTO_CYCLE_DAYS; i++) {
      for (const s of dailyVerseArtwork(addDays("2026-10-09", i))) {
        expect(seen.has(s.url)).toBe(false);
        seen.add(s.url);
        expect(s.url).toStartWith("/__l5e/assets-v1/");
      }
    }
    expect(seen.size).toBe(VERSE_PHOTO_CYCLE_DAYS * 3);
  });
  test("every day changes all three photos", () => {
    const a = dailyVerseArtwork("2026-10-09"), b = dailyVerseArtwork("2026-10-10");
    for (let i = 0; i < 3; i++) expect(a[i].url).not.toBe(b[i].url);
  });
});
