import { describe, expect, test } from "bun:test";
import { VERSE_IMAGE_STYLES } from "./verseImageStyles";

describe("verse image choices", () => {
  test("offers exactly three distinct image treatments for the same verse", () => {
    expect(VERSE_IMAGE_STYLES).toHaveLength(3);
    expect(new Set(VERSE_IMAGE_STYLES.map(style => style.id)).size).toBe(3);
    expect(new Set(VERSE_IMAGE_STYLES.map(style => style.background.join())).size).toBe(3);
  });
});