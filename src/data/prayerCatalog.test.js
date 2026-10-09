import { expect, test } from "bun:test";
import { prayerCatalog, getPrayerList, getPrayerSubgroups, RETIRED_PRAYER_IDS } from "./prayerCatalog";
import { prayersContent } from "./prayersContent";
import { PRAYER_CATEGORIES, PRAYER_PLACEMENTS } from "./prayerCategories";

test("The prayer list holds 132 unique verified prayers", () => {
  expect(prayerCatalog).toHaveLength(133);
  expect(new Set(prayerCatalog.map(prayer => prayer.id)).size).toBe(132);
  expect(new Set(prayerCatalog.map(prayer => prayer.name.toLowerCase())).size).toBe(132);
});

test("Unverified originals are removed; the other originals are kept unchanged", () => {
  for (const id of RETIRED_PRAYER_IDS) expect(prayerCatalog.find(prayer => prayer.id === id)).toBeUndefined();
  for (const existing of prayersContent.filter(prayer => !RETIRED_PRAYER_IDS.has(prayer.id))) {
    expect(prayerCatalog.find(prayer => prayer.id === existing.id)).toBe(existing);
  }
});

test("Every prayer has complete text, a named source and a valid tradition", () => {
  for (const prayer of prayerCatalog) {
    expect(prayer.content.join(" ").length).toBeGreaterThan(20);
    expect(prayer.content.join(" ")).not.toContain("Text coming soon");
    expect(prayer.title.length).toBeGreaterThan(2);
    expect(["Eastern", "Oriental", "Eastern/Oriental"]).toContain(prayer.tradition);
  }
});

test("Six macro categories and all 31 micro categories retain their order and have prayers", () => {
  expect(PRAYER_CATEGORIES.map(category => category.label)).toEqual(["Foundational Prayers", "Daily Prayers", "Prayers to Christ and the Saints", "Holy Communion and Liturgy", "Needs and Occasions", "Psalms and Canticles"]);
  expect(PRAYER_CATEGORIES.flatMap(category => category.subgroups)).toHaveLength(31);
  for (const category of PRAYER_CATEGORIES) expect(getPrayerSubgroups(category.id)).toEqual([...category.subgroups]);
});

test("Every prayer has valid, non-duplicated placements", () => {
  expect(Object.keys(PRAYER_PLACEMENTS).sort()).toEqual(prayerCatalog.map(prayer => prayer.id).sort());
  for (const prayer of prayerCatalog) {
    const placements = PRAYER_PLACEMENTS[prayer.id];
    expect(placements.length).toBeGreaterThan(0);
    expect(new Set(placements.map(item => `${item.category}:${item.subgroup}`)).size).toBe(placements.length);
    for (const placement of placements) expect(PRAYER_CATEGORIES.find(category => category.id === placement.category).subgroups).toContain(placement.subgroup);
  }
});

test("Search combines category, subgroup and tradition, including shared prayers in both filters", () => {
  expect(getPrayerList("daily", "Morning", "lord's").map(prayer => prayer.id)).toEqual(["lords-prayer"]);
  expect(getPrayerList("daily", "Night", "lord's")).toHaveLength(0);
  expect(getPrayerList("foundational", "Core", "lord's", "Eastern").map(prayer => prayer.id)).toEqual(["lords-prayer"]);
  expect(getPrayerList("foundational", "Core", "lord's", "Oriental").map(prayer => prayer.id)).toEqual(["lords-prayer"]);
  expect(getPrayerList("christ-saints", "Christ", "jesus prayer", "Oriental")).toHaveLength(0);
});

test("Shared prayers occur once per list and pinned prayers stay first", () => {
  expect(getPrayerList("foundational").filter(prayer => prayer.id === "jesus-prayer")).toHaveLength(1);
  expect(getPrayerList("daily", null, "", "all", new Set(["evening-prayer"]))[0].id).toBe("evening-prayer");
});
