import library from "@/assets/verse-backgrounds/dailyLibrary.json";

export type VerseTreatment = "golden" | "pilgrim" | "midnight";
export interface VerseImageStyle { id: string; title: string; treatment: VerseTreatment; url: string; credit: string }

export const VERSE_IMAGE_STYLES: readonly { treatment: VerseTreatment; title: string }[] = [
  { treatment: "golden", title: "Golden Hour" },
  { treatment: "pilgrim", title: "Woodland Light" },
  { treatment: "midnight", title: "Starry Night" },
];

type Photo = { url: string; credit: string; source: string };
const LIBRARY = library as Record<VerseTreatment, Photo[]>;
/** Days before any photo can come back (every category holds this many unique photos). */
export const VERSE_PHOTO_CYCLE_DAYS = Math.min(...VERSE_IMAGE_STYLES.map(s => LIBRARY[s.treatment].length));
const START_DAY = Math.floor(Date.parse("2026-10-09T00:00:00Z") / 86400000);

export function verseArtworkDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The three photos for a local day: one new photo per category, no repeats within the cycle. */
export function dailyVerseArtwork(day: string): VerseImageStyle[] {
  const dayIndex = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000) - START_DAY;
  const slot = ((dayIndex % VERSE_PHOTO_CYCLE_DAYS) + VERSE_PHOTO_CYCLE_DAYS) % VERSE_PHOTO_CYCLE_DAYS;
  return VERSE_IMAGE_STYLES.map(({ treatment, title }) => {
    const photo = LIBRARY[treatment][slot];
    return { id: `${treatment}:${slot}`, title, treatment, url: photo.url, credit: photo.credit };
  });
}
