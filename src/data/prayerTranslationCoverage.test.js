import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { prayerCatalog } from "./prayerCatalog";
import { getPrayerSections, translatePrayerParagraph } from "./prayerSections";

const languages = ["am", "ar", "hy", "bg", "fr", "ka", "el", "he", "ml", "pt", "ro", "ru", "sr", "es", "ti", "uk"];
const normalize = text => text.replace(/\s+/g, " ").trim();
function covered(text, dictionary) {
  if (!text.trim()) return true;
  if (dictionary[normalize(text)]) return true;
  if (text.includes("\n")) return text.split("\n").every(line => covered(line, dictionary));
  const sentences = normalize(text).split(/(?<=[.!?])\s+/);
  return sentences.length > 1 && sentences.every(sentence => !!dictionary[sentence]);
}
for (const language of languages) {
  test(`${language}: all prayer and explanation paragraphs have complete existing translation coverage`, () => {
    const dictionary = JSON.parse(readFileSync(new URL(`../../public/i18n/${language}.json`, import.meta.url), "utf8"));
    const missing = [];
    for (const prayer of prayerCatalog) {
      const sections = getPrayerSections(prayer.id, prayer.content);
      for (const [index, paragraph] of [...sections.prayer, ...sections.explanation].entries()) {
        const escaped = paragraph.replace(/\n/g, "\\n");
        if (!dictionary[normalize(escaped)] && !covered(paragraph, dictionary)) missing.push(`${prayer.id}:${index}`);
      }
    }
    expect(missing).toEqual([]);
  });
}
test("escaped imported prayer translations restore real line breaks without changing source", () => {
  const source = "first\nsecond";
  expect(translatePrayerParagraph(source, text => text === "first\\nsecond" ? "premier\\ndeuxième" : text)).toBe("premier\ndeuxième");
  expect(translatePrayerParagraph(source, text => text)).toBe(source);
});