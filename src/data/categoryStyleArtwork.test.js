import { expect, test } from "bun:test";
import { SAINT_CATEGORIES } from "./saintCategories";
import { PRAYER_CATEGORIES } from "./prayerCategories";
import { categoryArtwork } from "./categoryStyleArtwork";

test("Original leaves all existing category art untouched", () => {
  for (const category of SAINT_CATEGORIES) expect(categoryArtwork("saints", "original", category.id)).toBeNull();
  for (const category of PRAYER_CATEGORIES) expect(categoryArtwork("prayers", "original", category.id)).toBeNull();
});

test("each tradition covers all seven saint and six prayer categories with stored credited art", () => {
  expect(SAINT_CATEGORIES).toHaveLength(7);
  expect(PRAYER_CATEGORIES).toHaveLength(6);
  for (const style of ["tewahedo", "coptic", "byzantine"]) {
    for (const [section, categories] of [["saints", SAINT_CATEGORIES], ["prayers", PRAYER_CATEGORIES]]) {
      for (const category of categories) {
        const art = categoryArtwork(section, style, category.id);
        expect(art).not.toBeNull();
        expect(art.image_url).toStartWith("/__l5e/assets-v1/");
        expect(new URL(art.image_source).hostname).toBe("commons.wikimedia.org");
        expect(art.image_license).toMatch(/^(Public domain|CC)/);
        expect(art.image_author.length).toBeGreaterThan(0);
        expect(art.image_license_url).toStartWith("https://creativecommons.org/");
      }
    }
  }
});