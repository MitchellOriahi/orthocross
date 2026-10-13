import { expect, test } from "bun:test";
import { SAINT_CATEGORIES } from "./saintCategories";
import { PRAYER_CATEGORIES } from "./prayerCategories";
import { categoryArtwork } from "./categoryStyleArtwork";

// Photographs the app owner supplied; they carry no online source or licence link.
const SUPPLIED = ["tewahedo-selassie-panel.jpg", "tewahedo-selassie-manuscript.jpg", "tewahedo-theotokos.jpg", "tewahedo-george.jpg", "tewahedo-angels-michael.jpg", "tewahedo-archangel-wings.jpg"];

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
        expect(art.image_author.length).toBeGreaterThan(0);
        if (art.image_license === "Supplied by the app owner") {
          expect(art.image_source).toBe("");
          expect(art.image_license_url).toBe("");
        } else {
          expect(new URL(art.image_source).hostname).toBe("commons.wikimedia.org");
          expect(art.image_license).toMatch(/^(Public domain|CC)/);
          expect(art.image_license_url).toStartWith("https://creativecommons.org/");
        }
      }
    }
  }
});

test("Tewahedo Saints top row shows the two supplied Trinity photographs", () => {
  const angels = categoryArtwork("saints", "tewahedo", "angels");
  const biblical = categoryArtwork("saints", "tewahedo", "biblical");
  expect(angels.image_url).toContain(SUPPLIED[0]);
  expect(biblical.image_url).toContain(SUPPLIED[1]);
  for (const art of [angels, biblical]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("");
  }
});

test("Tewahedo Saints middle row shows the supplied Theotokos and Saint George photographs", () => {
  const monastics = categoryArtwork("saints", "tewahedo", "monastics");
  const fathers = categoryArtwork("saints", "tewahedo", "fathers-hierarchs");
  expect(monastics.image_url).toContain("tewahedo-theotokos.jpg");
  expect(fathers.image_url).toContain("tewahedo-george.jpg");
  for (const art of [monastics, fathers]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("");
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
  }
});

test("Tewahedo Saints row below the middle shows the two supplied archangel photographs", () => {
  const martyrs = categoryArtwork("saints", "tewahedo", "martyrs");
  const missionaries = categoryArtwork("saints", "tewahedo", "apostles-missionaries");
  expect(martyrs.image_url).toContain("tewahedo-angels-michael.jpg");
  expect(missionaries.image_url).toContain("tewahedo-archangel-wings.jpg");
  for (const art of [martyrs, missionaries]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("");
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
  }
});

test("supplied photographs stay out of the remaining Tewahedo category and every prayer tile", () => {
  for (const category of ["laypeople"]) {
    const art = categoryArtwork("saints", "tewahedo", category);
    for (const name of SUPPLIED) expect(art.image_url.includes(name)).toBe(false);
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "tewahedo", category.id);
    for (const name of SUPPLIED) expect(art.image_url.includes(name)).toBe(false);
  }
});
