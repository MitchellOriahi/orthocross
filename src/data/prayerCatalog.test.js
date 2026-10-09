import { expect, test } from "bun:test";
import { prayerCatalog, getPrayerList, getPrayerSubgroups } from "./prayerCatalog";
import { prayerAdditions } from "./prayerAdditions";
import { prayersContent } from "./prayersContent";
import { PRAYER_CATEGORIES, PRAYER_PLACEMENTS } from "./prayerCategories";
import supplied from "./prayerImport.fixture.json";

test("All 120 supplied entries resolve to one prayer and retain every requested placement", () => {
  expect(supplied).toHaveLength(120);
  expect(prayerAdditions).toHaveLength(115);
  expect(prayerCatalog).toHaveLength(127);
  for (const row of supplied) {
    const matches = prayerCatalog.filter(prayer => prayer.id === row.id);
    expect(matches).toHaveLength(1);
    for (const placement of row.placements) expect(PRAYER_PLACEMENTS[row.id]).toContainEqual(placement);
  }
});

test("All twelve existing prayers retain every original field and have a category", () => {
  expect(prayersContent).toHaveLength(12);
  for (const existing of prayersContent) {
    expect(prayerCatalog.find(prayer => prayer.id === existing.id)).toBe(existing);
    expect(PRAYER_PLACEMENTS[existing.id].length).toBeGreaterThan(0);
  }
  expect(prayerCatalog.find(prayer => prayer.id === "jesus-prayer").tradition).toBe("Eastern");
  expect(prayerCatalog.find(prayer => prayer.id === "thanksgiving").tradition).toBe("Eastern");
});

test("New prayers carry real text (no placeholders), exact supplied names and traditions", () => {
  for (const prayer of prayerAdditions) {
    expect(prayer.content[0].length).toBeGreaterThan(20);
    expect(prayer.content.join(" ")).not.toContain("Text coming soon");
    const row = supplied.find(entry => entry.id === prayer.id);
    expect(prayer.name).toBe(row.name);
    expect(prayer.tradition).toBe(row.tradition);
  }
});

test("Six macro categories and all 31 micro categories retain their supplied order", () => {
  expect(PRAYER_CATEGORIES.map(category => category.label)).toEqual(["Foundational Prayers", "Daily Prayers", "Prayers to Christ and the Saints", "Holy Communion and Liturgy", "Needs and Occasions", "Psalms and Canticles"]);
  expect(PRAYER_CATEGORIES.flatMap(category => category.subgroups)).toHaveLength(31);
  for (const category of PRAYER_CATEGORIES) expect(getPrayerSubgroups(category.id)).toEqual([...category.subgroups]);
});

test("Every placement is category-qualified, valid and non-duplicated", () => {
  expect(new Set(prayerCatalog.map(prayer => prayer.id)).size).toBe(127);
  for (const prayer of prayerCatalog) {
    const placements = PRAYER_PLACEMENTS[prayer.id];
    expect(new Set(placements.map(item => `${item.category}:${item.subgroup}`)).size).toBe(placements.length);
    for (const placement of placements) expect(PRAYER_CATEGORIES.find(category => category.id === placement.category).subgroups).toContain(placement.subgroup);
  }
});

test("Search combines category, subgroup and tradition, including shared prayers in both filters", () => {
  expect(getPrayerList("daily", "Morning", "lord's").map(prayer => prayer.id)).toEqual(["lords-prayer"]);
  expect(getPrayerList("daily", "Night", "lord's")).toHaveLength(0);
  expect(getPrayerList("foundational", "Core", "lord's", "Eastern").map(prayer => prayer.id)).toEqual(["lords-prayer"]);
  expect(getPrayerList("foundational", "Core", "lord's", "Oriental").map(prayer => prayer.id)).toEqual(["lords-prayer"]);
  expect(getPrayerList("christ-saints", "Christ", "jesus", "Oriental")).toHaveLength(0);
  expect(getPrayerList(null, null, "kingdom")).toHaveLength(0);
});

test("Overlapping prayers occur only once per list and keep existing pinned-first sorting", () => {
  expect(getPrayerList("foundational").filter(prayer => prayer.id === "jesus-prayer")).toHaveLength(1);
  expect(getPrayerList(null, null, "jesus").filter(prayer => prayer.id === "jesus-prayer")).toHaveLength(1);
  expect(getPrayerList("daily", null, "", "all", new Set(["evening-prayer"]))[0].id).toBe("evening-prayer");
});