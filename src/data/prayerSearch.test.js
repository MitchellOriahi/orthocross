import { expect, test } from "bun:test";
import { matchesPrayerQuery, matchesPrayerTradition } from "./prayerSearch";
import { prayersContent } from "./prayersContent";

const byName = (name) => prayersContent.find((prayer) => prayer.name === name);

test("Search finds a prayer by a word in its name", () => {
  expect(matchesPrayerQuery(byName("The Nicene Creed"), "creed")).toBe(true);
  expect(matchesPrayerQuery(byName("Coptic 'Our Father'"), "our father")).toBe(true);
});

test("Search finds a prayer by a word in its short title", () => {
  expect(matchesPrayerQuery(byName("The Lord's Prayer"), "jesus taught")).toBe(true);
  expect(matchesPrayerQuery(byName("Trisagion Prayer"), "thrice-holy")).toBe(true);
});

test("Search ignores letter case, extra spaces and quote style", () => {
  expect(matchesPrayerQuery(byName("Coptic 'Our Father'"), "OUR   father")).toBe(true);
  expect(matchesPrayerQuery(byName("Coptic 'Our Father'"), "“our father”")).toBe(true);
});

test("Search ignores words that only appear inside the prayer itself", () => {
  // "kingdom" is in the text of the Lord's Prayer, but not in its name or title.
  expect(matchesPrayerQuery(byName("The Lord's Prayer"), "kingdom")).toBe(false);
});

test("An empty search keeps every prayer visible", () => {
  expect(prayersContent.filter((p) => matchesPrayerQuery(p, "")).length).toBe(prayersContent.length);
});

test("Eastern includes shared prayers and excludes Oriental-only ones", () => {
  expect(matchesPrayerTradition(byName("The Lord's Prayer"), "Eastern")).toBe(true);
  expect(matchesPrayerTradition(byName("Armenian Prayer of Light"), "Eastern")).toBe(false);
  expect(matchesPrayerTradition(byName("Armenian Prayer of Light"), "Oriental")).toBe(true);
  expect(matchesPrayerTradition(byName("Armenian Prayer of Light"), "all")).toBe(true);
});
