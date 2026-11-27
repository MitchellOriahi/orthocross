import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { prayerCatalog } from "./prayerCatalog";
import { prayerAdditions } from "./prayerAdditions";
import { getPrayerSections } from "./prayerSections";
import { getAddedPrayerExplanation, PRAYER_EXPLANATION_TOPICS } from "./prayerExplanationContexts";
import { LANGUAGES } from "../lib/i18n/translations";
import { translateString } from "../lib/i18n/domTranslator";

test("every one of the 133 prayers has explanatory context without changing its prayer paragraphs", () => {
  expect(prayerCatalog).toHaveLength(133);
  for (const prayer of prayerCatalog) {
    const sections = getPrayerSections(prayer.id, prayer.content);
    const explanation = sections.explanation.length ? sections.explanation : getAddedPrayerExplanation(prayer.id, text => text);
    expect(explanation.length).toBeGreaterThan(0);
    expect([...sections.prayer, ...sections.explanation]).toEqual(prayer.content);
  }
});

test("all 124 added records resolve explicit context and unknown identities do not receive an invented explanation", () => {
  expect(prayerAdditions).toHaveLength(124);
  for (const prayer of prayerAdditions) expect(getAddedPrayerExplanation(prayer.id, text => text)).toHaveLength(2);
  expect(getAddedPrayerExplanation("unknown-prayer", text => text)).toEqual([]);
});

for (const { code } of LANGUAGES.filter(language => language.code !== "en")) {
  test(`${code}: new explanatory context and every source title translate completely`, () => {
    const dictionary = JSON.parse(readFileSync(new URL(`../../public/i18n/${code}.json`, import.meta.url), "utf8"));
    const missing = ["Source and liturgical context:", ...Object.values(PRAYER_EXPLANATION_TOPICS), ...prayerAdditions.map(prayer => prayer.title)]
      .filter(text => !dictionary[text.replace(/\s+/g, " ").trim()]?.trim());
    expect([...new Set(missing)]).toEqual([]);
    for (const prayer of prayerAdditions) {
      const localized = getAddedPrayerExplanation(prayer.id, text => translateString(text, dictionary));
      expect(localized).not.toEqual(getAddedPrayerExplanation(prayer.id, text => text));
      expect(localized).toHaveLength(2);
    }
  });
}