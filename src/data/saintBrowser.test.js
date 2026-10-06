import { describe, expect, test } from "bun:test";
import { saintsContent } from "./saintsContent";
import { SAINT_CATEGORIES } from "./saintCategories";
import { getCategoryCount, getCategorySaints, getCategoryTags, MIN_SAINTS_PER_TAG } from "./saintBrowser";

describe("Refined Saints browser", () => {
  test("counts the saved collection while all category lists remain hidden", () => {
    expect(SAINT_CATEGORIES.map(c => getCategoryCount(saintsContent, c.id))).toEqual([0, 6, 20, 29, 12, 3]);
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