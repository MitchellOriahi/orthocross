import { expect, test } from "bun:test";
import { prayerCatalog } from "./prayerCatalog";
import { getPrayerSections } from "./prayerSections";
import { completeMondayMaryPrayer, MONDAY_MARY_SOURCE } from "./prayerMondayMary";

test("Monday's Praise of Mary includes all nine source sections and the fast-day addition in the prayer body", () => {
  const prayer = prayerCatalog.find(record => record.id === "wudase-maryam-monday");
  expect(prayer).toBeDefined();
  if (!prayer) return;
  const sections = getPrayerSections(prayer.id, prayer.content);
  expect(MONDAY_MARY_SOURCE.sections).toBe(9);
  expect(sections.prayer).toEqual(completeMondayMaryPrayer);
  expect(sections.prayer).toHaveLength(10);
  expect(sections.prayer[1]).toContain("decree of judgement upon Eve");
  expect(sections.prayer[3]).toContain("Isaiah the Prophet");
  expect(sections.prayer[5]).toContain("He Who was and shall be");
  expect(sections.prayer[6]).toContain("dust thou art and to dust shalt thou return");
  expect(sections.prayer[7]).toContain("bill of indictment");
  expect(sections.prayer[9]).toContain("forty days and forty nights");
  expect(sections.explanation).toEqual([]);
});