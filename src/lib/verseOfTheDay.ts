// Same 8 verses, in the same order, as the backend `daily_verses` list, and the
// same rotation as `get_verse_of_the_day`, so the Board card, the 8 AM
// notification and the home screen widget always show the same verse.
export const SAMPLE_VERSES = [
  { reference: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
  { reference: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { reference: "Isaiah 41:10", text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand." },
  { reference: "Matthew 11:28", text: "Come to me, all who labor and are heavy laden, and I will give you rest." },
  { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
];

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
