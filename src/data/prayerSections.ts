import { prayerAdditions } from "./prayerAdditions";

// Audited boundaries in the unchanged original collection. Added records contain prayer text only.
const originalPrayerParagraphs: Record<string, number> = {
  "lords-prayer": 1, "jesus-prayer": 1, "nicene-creed": 9, trisagion: 1,
  "morning-prayer": 1, "coptic-our-father": 1, "evening-prayer": 1,
  thanksgiving: 1, "armenian-prayer": 1, "ethiopian-prayer": 1,
  "syrian-prayer": 1, "prayer-cross": 1,
};
const addedIds = new Set(prayerAdditions.map(prayer => prayer.id));

export function getPrayerSections(prayerId: string, content: readonly string[]) {
  const boundary = addedIds.has(prayerId) ? content.length : originalPrayerParagraphs[prayerId];
  const prayerEnd = boundary ?? content.length;
  return {
    prayer: content.slice(0, prayerEnd),
    explanation: content.slice(prayerEnd),
    originalExplanationOffset: boundary === undefined || addedIds.has(prayerId) ? 0 : Math.max(0, prayerEnd - 1),
  };
}

export function translatePrayerParagraph(paragraph: string, translate: (text: string) => string) {
  // Some approved dictionary entries retain literal escaped line breaks from their import.
  if (paragraph.includes("\n")) {
    const escaped = paragraph.replace(/\n/g, "\\n");
    const translated = translate(escaped);
    if (translated !== escaped) return translated.replace(/\\n/g, "\n");
  }
  return translate(paragraph);
}