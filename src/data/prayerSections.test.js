import { expect, test } from "bun:test";
import { prayerCatalog } from "./prayerCatalog";
import { prayerAdditions } from "./prayerAdditions";
import { getPrayerSections } from "./prayerSections";

test("the complete nine-paragraph Nicene Creed precedes its historical explanation", () => {
  const creed = prayerCatalog.find(prayer => prayer.id === "nicene-creed");
  const sections = getPrayerSections(creed.id, creed.content);
  expect(sections.prayer).toHaveLength(9);
  expect(sections.prayer[8]).toBe("I look for the resurrection of the dead, and the life of the age to come. Amen.");
  expect(sections.explanation[0]).toContain("First Council of Nicaea (325 AD)");
});
test("all 124 added prayers retain every prayer paragraph with no continuation in explanations", () => {
  expect(prayerAdditions).toHaveLength(124);
  for (const prayer of prayerAdditions) {
    const sections = getPrayerSections(prayer.id, prayer.content);
    expect(sections.prayer).toEqual(prayer.content);
    expect(sections.explanation).toEqual([]);
  }
});
test("all 133 prayers split losslessly in their original order", () => {
  expect(prayerCatalog).toHaveLength(133);
  for (const prayer of prayerCatalog) {
    const sections = getPrayerSections(prayer.id, prayer.content);
    expect([...sections.prayer, ...sections.explanation]).toEqual(prayer.content);
    expect(sections.prayer.length).toBeGreaterThan(0);
  }
});
test("boundaries are identical for translated paragraphs regardless of their wording", () => {
  for (const prayer of prayerCatalog) {
    const source = getPrayerSections(prayer.id, prayer.content);
    const translated = prayer.content.map((_, index) => `translated ${index}`);
    const sections = getPrayerSections(prayer.id, translated);
    expect(sections.prayer).toEqual(translated.slice(0, source.prayer.length));
    expect(sections.explanation).toEqual(translated.slice(source.prayer.length));
  }
});