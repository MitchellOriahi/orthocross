import DAILY_VERSES from "../../supabase/functions/_shared/dailyVerses.json";

// Same verses, in the same order, as the backend `daily_verses` list, and the
// same rotation as `get_verse_of_the_day`, so the Board card, the 8 AM
// notification and the home screen widget always show the same verse.
export const SAMPLE_VERSES: ReadonlyArray<{ reference: string; text: string }> = DAILY_VERSES;

const ROTATION_START_UTC = Date.UTC(2026, 0, 1);

/** The reader's local calendar date as YYYY-MM-DD. */
export const localDateKey = (date: Date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Index into the list for a local date, matching `(p_date - DATE '2026-01-01') % total`. */
export const verseIndexForDate = (dateKey: string, total: number = SAMPLE_VERSES.length) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const days = Math.round((Date.UTC(y, m - 1, d) - ROTATION_START_UTC) / 86_400_000);
  return ((days % total) + total) % total;
};

export const getVerseOfTheDay = (date: Date = new Date()) => SAMPLE_VERSES[verseIndexForDate(localDateKey(date))];
