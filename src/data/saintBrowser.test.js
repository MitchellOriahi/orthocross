import { describe, expect, test } from "bun:test";
import { saintsContent } from "./saintsContent";
import { SAINT_CATEGORIES } from "./saintCategories";
import { ANGEL_SUBCATEGORIES, CATEGORY_SUBCATEGORIES, MISSIONARY_SUBCATEGORIES, MONASTIC_SUBCATEGORIES, SAINT_SUBCATEGORY_MEMBERS, getCategoryCount, getCategorySaints, getCategoryTags, MIN_SAINTS_PER_TAG } from "./saintBrowser";

describe("Refined Saints browser", () => {
  test("offers the requested Angels sub-categories in order", () => {
    expect(ANGEL_SUBCATEGORIES).toEqual([
      "Archangels",
      "Heavenly Ranks",
      "Guardian Angels",
      "Heavenly Witnesses",
    ]);
    expect(CATEGORY_SUBCATEGORIES.angels).toEqual(ANGEL_SUBCATEGORIES);
  });
  test("offers the requested Missionaries sub-categories, each within the category", () => {
    expect(MISSIONARY_SUBCATEGORIES).toEqual([
      "Equal to Apostles",
      "Enlighteners",
      "Overseas Missionaries",
    ]);
    expect(CATEGORY_SUBCATEGORIES["apostles-missionaries"]).toEqual(MISSIONARY_SUBCATEGORIES);
    const missionaryIds = new Set(getCategorySaints(saintsContent, "apostles-missionaries", "", null, true).map(s => s.id));
    for (const [label, ids] of Object.entries(SAINT_SUBCATEGORY_MEMBERS)) {
      if (!MISSIONARY_SUBCATEGORIES.includes(label)) continue;
      expect(ids.length).toBeGreaterThanOrEqual(3);
      for (const id of ids) expect(missionaryIds.has(id)).toBe(true);
    }
    expect(SAINT_SUBCATEGORY_MEMBERS["Equal to Apostles"]).toContain("cyril-slavs");
    expect(SAINT_SUBCATEGORY_MEMBERS["Enlighteners"]).toContain("gregory-illuminator");
    expect(SAINT_SUBCATEGORY_MEMBERS["Overseas Missionaries"]).toContain("nicholas-japan");
  });
  test("offers the requested Monastics sub-categories, each within the category", () => {
    expect(MONASTIC_SUBCATEGORIES).toEqual([
      "Desert Fathers",
      "Desert Mothers",
      "Founders of Monasticism",
      "Stylites",
      "Holy Fools",
      "Athonites",
      "Elders",
    ]);
    expect(CATEGORY_SUBCATEGORIES.monastics).toEqual(MONASTIC_SUBCATEGORIES);
    const monasticIds = new Set(getCategorySaints(saintsContent, "monastics", "", null, true).map(s => s.id));
    for (const label of MONASTIC_SUBCATEGORIES) {
      const ids = SAINT_SUBCATEGORY_MEMBERS[label];
      if (label === "Stylites" || label === "Holy Fools") {
        // The collection holds no stylites or holy fools yet; pills stay visible and empty.
        expect(ids).toEqual([]);
        continue;
      }
      expect(ids.length).toBeGreaterThanOrEqual(3);
      for (const id of ids) expect(monasticIds.has(id)).toBe(true);
    }
    expect(SAINT_SUBCATEGORY_MEMBERS["Desert Fathers"]).toContain("anthony");
    expect(SAINT_SUBCATEGORY_MEMBERS["Desert Mothers"]).toContain("syncletica-alexandria");
    expect(SAINT_SUBCATEGORY_MEMBERS["Founders of Monasticism"]).toContain("pachomius-great");
    expect(SAINT_SUBCATEGORY_MEMBERS["Athonites"]).toContain("silouan-athonite");
    expect(SAINT_SUBCATEGORY_MEMBERS["Elders"]).toContain("seraphim-sarov");
  });
  test("counts the saved collection while all category lists remain hidden", () => {
    expect(SAINT_CATEGORIES.map(c => getCategoryCount(saintsContent, c.id))).toEqual([0, 6, 20, 29, 12, 26, 3]);
    for (const category of SAINT_CATEGORIES) expect(getCategorySaints(saintsContent, category.id)).toEqual([]);
    expect(getCategorySaints(saintsContent, null, "Nicholas")).toEqual([]);
  });
  test("shows only tags containing at least three saints in that category", () => {
    expect(MIN_SAINTS_PER_TAG).toBe(3);
    const tags = getCategoryTags(saintsContent, "fathers-hierarchs");
    expect(tags.find(t => t.label === "Cappadocian")?.count).toBe(3);
    expect(tags.find(t => t.label === "Wonderworker")?.count).toBe(5);
    expect(getCategoryTags(saintsContent, "rulers")).toEqual([{ label: "Equal-to-the-Apostles", count: 4 }]);
    for (const category of SAINT_CATEGORIES) for (const tag of getCategoryTags(saintsContent, category.id)) expect(tag.count).toBeGreaterThanOrEqual(3);
  });
  test("future restored lists combine name search and tag filtering", () => {
    expect(getCategorySaints(saintsContent, "fathers-hierarchs", "spyridon", "Wonderworker", true).map(s => s.id)).toEqual(["saint-spyridon-trimythous"]);
    expect(getCategorySaints(saintsContent, "rulers", "", "Athonite", true)).toEqual([]);
  });
});