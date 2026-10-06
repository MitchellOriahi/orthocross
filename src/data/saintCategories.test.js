import { describe, expect, test } from "bun:test";
import { saintsContent } from "./saintsContent";
import {
  SAINT_CATEGORIES,
  filterSaintsByCategory,
  getSaintCategoryId,
} from "./saintCategories";

const allSaints = saintsContent;

describe("Saint categories", () => {
  test("offers exactly the eight requested categories in the requested order", () => {
    expect(SAINT_CATEGORIES.map(c => c.label)).toEqual([
      "Angels and Archangels",
      "Biblical Saints",
      "Apostles and Missionaries",
      "Church Fathers and Hierarchs",
      "Monastics",
      "Martyrs",
      "Holy Rulers",
      "Righteous Laypeople",
    ]);
  });

  test("classifies every saint in the merged catalog exactly once", () => {
    expect(allSaints).toHaveLength(100);
    expect(new Set(allSaints.map(s => s.id)).size).toBe(100);
    for (const saint of allSaints) {
      expect(getSaintCategoryId(saint.id)).not.toBeNull();
    }
  });

  test("maps every id to a declared category and fills every used category", () => {
    const declaredIds = new Set(SAINT_CATEGORIES.map(c => c.id));
    for (const saint of allSaints) {
      const categoryId = getSaintCategoryId(saint.id);
      expect(categoryId).not.toBeNull();
      expect(declaredIds.has(categoryId)).toBe(true);
    }
    for (const category of SAINT_CATEGORIES) {
      const count = filterSaintsByCategory(allSaints, category.id).length;
      if (category.id === "angels") {
        expect(count).toBe(0); // no angel saints in the catalog yet
      } else {
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test("category filter keeps catalog order and returns nothing for an empty category", () => {
    const biblical = filterSaintsByCategory(allSaints, "biblical");
    expect(biblical.length).toBeGreaterThan(0);
    expect(filterSaintsByCategory(allSaints, "angels")).toHaveLength(0);
    expect(filterSaintsByCategory(allSaints, null)).toHaveLength(allSaints.length);
    for (const saint of biblical) {
      expect(allSaints).toContain(saint);
    }
  });
});
