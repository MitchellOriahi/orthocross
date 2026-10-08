export const VERSE_IMAGE_STYLES = [
  { id: "golden", title: "Golden Hour" },
  { id: "pilgrim", title: "Woodland Light" },
  { id: "midnight", title: "Starry Night" },
  { id: "dawn", title: "Seaside Dawn" },
  { id: "mountain", title: "Mountain Sunrise" },
  { id: "candlelight", title: "Candlelight" },
  { id: "desert", title: "Desert Dusk" },
] as const;

/** Rotates the default verse design so each day of the year opens with a different background. */
export function dailyVerseStyleIndex(date: Date = new Date()): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  return dayOfYear % VERSE_IMAGE_STYLES.length;
}
