import { describe, expect, test } from "bun:test";
import {
  CREATOR_NOTES,
  pickCreatorNoteIndex,
  renderCreatorNote,
} from "../../supabase/functions/_shared/donorStats.ts";

describe("creator thank-you notes", () => {
  test("there are several different notes", () => {
    expect(CREATOR_NOTES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(CREATOR_NOTES.map((n) => n.paragraphs[0])).size).toBe(CREATOR_NOTES.length);
  });

  test("each gift in order shows the next note, then it cycles", () => {
    expect(pickCreatorNoteIndex(0)).toBe(0);
    expect(pickCreatorNoteIndex(1)).toBe(1);
    expect(pickCreatorNoteIndex(2)).toBe(2);
    expect(pickCreatorNoteIndex(CREATOR_NOTES.length)).toBe(0);
    expect(pickCreatorNoteIndex(CREATOR_NOTES.length + 1)).toBe(1);
  });

  test("every rendered note carries the creator's title and signature", () => {
    for (let i = 0; i < CREATOR_NOTES.length; i++) {
      const html = renderCreatorNote(i, "dark");
      expect(html).toContain("A personal note from the creator of OrthoCross");
      expect(html).toContain("The creator of OrthoCross");
    }
  });

  test("the checkout thank-you email uses the light theme", () => {
    expect(renderCreatorNote(0, "light")).toContain("#8b4513");
    expect(renderCreatorNote(0, "light")).toContain("#e5d9cc");
  });
});
