import { describe, expect, test } from "bun:test";
import { dailyVerseArtwork, initialVerseArtwork, replaceVerseArtwork, restoreVerseArtwork } from "./verseImageStyles";

describe("daily verse artwork", () => {
  test("all three designs change each local day and remain stable within it", () => {
    const first = dailyVerseArtwork("2026-10-08");
    const next = dailyVerseArtwork("2026-10-09");
    expect(first).toEqual(dailyVerseArtwork("2026-10-08"));
    expect(first.choices).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(first.choices[i].id).not.toBe(next.choices[i].id);
      expect(first.choices[i].title).not.toBe(next.choices[i].title);
    }
  });
  test("New Image supplies three genuinely new options then stops", () => {
    const day = "2026-10-08";
    let session = initialVerseArtwork(day);
    const seen = new Set(session.ids);
    for (let i = 0; i < 3; i++) {
      session = replaceVerseArtwork(day, session, 0);
      expect(seen.has(session.ids[0])).toBe(false);
      seen.add(session.ids[0]);
      expect(session.ids).toHaveLength(3);
    }
    expect(seen.size).toBe(6);
    expect(session.replacements).toBe(3);
    expect(replaceVerseArtwork(day, session, 1)).toBe(session);
  });
  test("reopening preserves extra-image usage, and a new day resets it", () => {
    const day = "2026-10-08";
    const session = replaceVerseArtwork(day, initialVerseArtwork(day), 2);
    expect(restoreVerseArtwork(day, JSON.stringify(session))).toEqual(session);
    expect(restoreVerseArtwork("2026-10-09", null).replacements).toBe(0);
    expect(restoreVerseArtwork(day, '{"ids":[],"replacements":99}')).toEqual(initialVerseArtwork(day));
  });
});