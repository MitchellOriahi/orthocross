import { describe, expect, test } from "bun:test";
import { VERSE_IMAGE_STYLES } from "./verseImageStyles";
import { imageSharePayload } from "./verseImageSharing";

describe("verse image choices", () => {
  test("offers exactly three distinct image treatments for the same verse", () => {
    expect(VERSE_IMAGE_STYLES).toHaveLength(3);
    expect(new Set(VERSE_IMAGE_STYLES.map(style => style.id)).size).toBe(3);
    expect(new Set(VERSE_IMAGE_STYLES.map(style => style.prompt)).size).toBe(3);
  });
  test("Golden Hour requests sunset artwork", () => {
    expect(VERSE_IMAGE_STYLES.find(style => style.id === "golden")?.prompt).toContain("sunset");
  });
  test("Pilgrim’s Path requests a winding stone path", () => {
    expect(VERSE_IMAGE_STYLES.find(style => style.id === "pilgrim")?.prompt).toContain("winding ancient stone path");
  });
  test("Midnight Gold requests a gold-star night scene", () => {
    expect(VERSE_IMAGE_STYLES.find(style => style.id === "midnight")?.prompt).toContain("midnight sky filled with small gold stars");
  });
  test("sharing attaches the image without pasted verse text or a URL", () => {
    const file = new File(["image bytes"], "verse.png", { type: "image/png" });
    expect(imageSharePayload(file)).toEqual({ files: [file] });
  });
});