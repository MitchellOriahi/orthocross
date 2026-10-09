import { describe, expect, test } from "bun:test";
import { dailyVerseArtwork } from "./verseImageStyles";
import { imageSharePayload } from "./verseImageSharing";
import { loadVerseBackground } from "./versePhotoBackgrounds";

describe("verse image choices", () => {
  test("offers exactly three distinct photos for the same verse", () => {
    const styles = dailyVerseArtwork("2026-10-09");
    expect(styles).toHaveLength(3);
    expect(new Set(styles.map(s => s.url)).size).toBe(3);
    for (const s of styles) expect(s.url).toStartWith("/__l5e/assets-v1/");
  });
  test("preloaded backgrounds are reused for immediate composition", async () => {
    const original = globalThis.Image;
    let loads = 0;
    globalThis.Image = class {
      set src(value) { loads++; queueMicrotask(() => this.onload?.()); }
    };
    try {
      const first = loadVerseBackground("/x.jpg");
      expect(loadVerseBackground("/x.jpg")).toBe(first);
      await first;
      expect(loads).toBe(1);
    } finally { globalThis.Image = original; }
  });
  test("sharing attaches the image without pasted verse text or a URL", () => {
    const file = new File(["image bytes"], "verse.png", { type: "image/png" });
    expect(imageSharePayload(file)).toEqual({ files: [file] });
  });
});