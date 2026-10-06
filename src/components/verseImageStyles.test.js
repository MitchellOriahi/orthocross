import { describe, expect, test } from "bun:test";
import { VERSE_IMAGE_STYLES } from "./verseImageStyles";
import { imageSharePayload } from "./verseImageSharing";
import { VERSE_PHOTO_BACKGROUNDS, loadVerseBackground } from "./versePhotoBackgrounds";

describe("verse image choices", () => {
  test("offers exactly three distinct image treatments for the same verse", () => {
    expect(VERSE_IMAGE_STYLES).toHaveLength(3);
    expect(new Set(VERSE_IMAGE_STYLES.map(style => style.id)).size).toBe(3);
    expect(new Set(VERSE_IMAGE_STYLES.map(style => VERSE_PHOTO_BACKGROUNDS[style.id])).size).toBe(3);
  });
  test("each choice uses a stored photo rather than an AI request or external hotlink", () => {
    for (const style of VERSE_IMAGE_STYLES) {
      expect(VERSE_PHOTO_BACKGROUNDS[style.id]).toStartWith("/__l5e/assets-v1/");
    }
  });
  test("preloaded backgrounds are reused for immediate composition", async () => {
    const original = globalThis.Image;
    let loads = 0;
    globalThis.Image = class {
      set src(value) { loads++; queueMicrotask(() => this.onload?.()); }
    };
    try {
      const first = loadVerseBackground("golden");
      expect(loadVerseBackground("golden")).toBe(first);
      await first;
      expect(loads).toBe(1);
    } finally { globalThis.Image = original; }
  });
  test("sharing attaches the image without pasted verse text or a URL", () => {
    const file = new File(["image bytes"], "verse.png", { type: "image/png" });
    expect(imageSharePayload(file)).toEqual({ files: [file] });
  });
});