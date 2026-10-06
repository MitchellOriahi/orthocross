import { expect, test } from "bun:test";
import { SAINT_DISPLAY_ICONS, SAINT_CATEGORY_DISPLAY_ICON } from "./saintDisplayIcons";

test("every accepted icon retains provenance and a reusable license", () => {
  expect(Object.keys(SAINT_DISPLAY_ICONS).length).toBeGreaterThan(0);
  for (const [id, icon] of Object.entries(SAINT_DISPLAY_ICONS)) {
    if (id === "archangel-michael") {
      // Owner-provided artwork: provenance states the origin instead of
      // inventing a Commons source, and stays in the same replaceable registry.
      expect(icon.image_source).toContain("Provided by the app owner");
      expect(icon.image_license).toBe("Owner-provided");
    } else {
      expect(new URL(icon.image_source).hostname).toBe("commons.wikimedia.org");
      expect(icon.image_license).toMatch(/^(Public domain|CC BY)/);
    }
    expect(icon.image_url).toStartWith("/__l5e/assets-v1/");
    expect(icon.image_author.length).toBeGreaterThan(0);
    expect(icon.image_modification.length).toBeGreaterThan(0);
  }
});

test("Angels use Michael without adding a saint to the preserved catalog", () => {
  expect(SAINT_CATEGORY_DISPLAY_ICON.angels).toBe("archangel-michael");
  expect(SAINT_DISPLAY_ICONS[SAINT_CATEGORY_DISPLAY_ICON.angels]).toBeDefined();
});

test("unsuitable and unaudited images never fall back to legacy artwork", () => {
  expect(SAINT_DISPLAY_ICONS["vladimir-kyiv"]).toBeUndefined();
  expect(SAINT_DISPLAY_ICONS["saint-gregory-nazianzus"]).toBeUndefined();
  expect(SAINT_DISPLAY_ICONS["unknown-saint"]).toBeUndefined();
});