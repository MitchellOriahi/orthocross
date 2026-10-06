import { expect, test } from "bun:test";
import { SAINT_DISPLAY_ICONS, SAINT_CATEGORY_DISPLAY_ICON } from "./saintDisplayIcons";

test("every accepted icon retains provenance and a reusable license", () => {
  expect(Object.keys(SAINT_DISPLAY_ICONS).length).toBeGreaterThan(0);
  for (const [id, icon] of Object.entries(SAINT_DISPLAY_ICONS)) {
    if (icon.image_license === "Owner-provided") {
      // Owner-provided artwork (e.g. LRP studio icons): provenance states the
      // origin instead of inventing a Commons source, and stays in the same
      // replaceable registry.
      expect(icon.image_source).toContain("Provided by the app owner");
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

test("Monastics use the owner-provided Saint Anthony icon with angel-style display", () => {
  expect(SAINT_CATEGORY_DISPLAY_ICON.monastics).toBe("saint-anthony-lrp");
  const icon = SAINT_DISPLAY_ICONS["saint-anthony-lrp"];
  expect(icon).toBeDefined();
  expect(icon.image_fit).toBe("contain");
  expect(icon.image_glow).toBe(true);
  expect(icon.image_source).toContain("Provided by the app owner");
});

test("Biblical Saints use the owner-provided Theotokos icon with angel-style display", () => {
  expect(SAINT_CATEGORY_DISPLAY_ICON.biblical).toBe("theotokos-seven-swords-lrp");
  const icon = SAINT_DISPLAY_ICONS["theotokos-seven-swords-lrp"];
  expect(icon).toBeDefined();
  expect(icon.image_fit).toBe("contain");
  expect(icon.image_glow).toBe(true);
  expect(icon.image_source).toContain("Provided by the app owner");
});

test("Church Fathers use the owner-provided Saint Nicholas icon with angel-style display", () => {
  expect(SAINT_CATEGORY_DISPLAY_ICON["fathers-hierarchs"]).toBe("saint-nicholas-lrp");
  const icon = SAINT_DISPLAY_ICONS["saint-nicholas-lrp"];
  expect(icon).toBeDefined();
  expect(icon.image_fit).toBe("contain");
  expect(icon.image_glow).toBe(true);
  expect(icon.image_source).toContain("Provided by the app owner");
});

test("Martyrs use the owner-provided Saint Stephen icon with angel-style display", () => {
  expect(SAINT_CATEGORY_DISPLAY_ICON.martyrs).toBe("saint-stephen-lrp");
  const icon = SAINT_DISPLAY_ICONS["saint-stephen-lrp"];
  expect(icon).toBeDefined();
  expect(icon.image_fit).toBe("contain");
  expect(icon.image_glow).toBe(true);
  expect(icon.image_source).toContain("Provided by the app owner");
});

test("Missionaries use the audited Saint Timothy portrait in standard display", () => {
  expect(SAINT_CATEGORY_DISPLAY_ICON["apostles-missionaries"]).toBe("timothy-apostle");
  const icon = SAINT_DISPLAY_ICONS["timothy-apostle"];
  expect(icon).toBeDefined();
  expect(new URL(icon.image_source).hostname).toBe("commons.wikimedia.org");
  expect(icon.image_fit).toBeUndefined(); // cover crop, not the contain treatment
  expect(icon.image_glow).toBeUndefined();
});

test("unsuitable and unaudited images never fall back to legacy artwork", () => {
  expect(SAINT_DISPLAY_ICONS["vladimir-kyiv"]).toBeUndefined();
  expect(SAINT_DISPLAY_ICONS["saint-gregory-nazianzus"]).toBeUndefined();
  expect(SAINT_DISPLAY_ICONS["unknown-saint"]).toBeUndefined();
});