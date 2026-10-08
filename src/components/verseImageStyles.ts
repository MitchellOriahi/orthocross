export type VerseTreatment = "golden" | "pilgrim" | "midnight";
export interface VerseImageStyle { id: string; title: string; treatment: VerseTreatment }

export const VERSE_IMAGE_STYLES: readonly VerseImageStyle[] = [
  { id: "golden", title: "Golden Hour", treatment: "golden" },
  { id: "pilgrim", title: "Woodland Light", treatment: "pilgrim" },
  { id: "midnight", title: "Starry Night", treatment: "midnight" },
];

export const EXTRA_IMAGE_LIMIT = 3;
// Each column keeps its own typographic treatment while the scenery changes.
export const VERSE_ARTWORK_POOL: readonly VerseImageStyle[] = [
  ...VERSE_IMAGE_STYLES,
  { id: "mountain", title: "Sunlit Peaks", treatment: "golden" },
  { id: "river", title: "River Peace", treatment: "pilgrim" },
  { id: "moon", title: "Twilight Hills", treatment: "midnight" },
  { id: "sea", title: "Ocean Light", treatment: "golden" },
  { id: "flowers", title: "Wildflower Joy", treatment: "pilgrim" },
  { id: "aurora", title: "Moonlit Peaks", treatment: "midnight" },
  { id: "desert", title: "Desert Stillness", treatment: "golden" },
  { id: "forest", title: "Forest Sunlight", treatment: "pilgrim" },
  { id: "night", title: "Crescent Night", treatment: "midnight" },
];

export function verseArtworkDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dailyVerseArtwork(day: string) {
  const index = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const offset = ((index % 4) + 4) % 4;
  const choices = VERSE_ARTWORK_POOL.slice(offset * 3, offset * 3 + 3);
  const extras = VERSE_ARTWORK_POOL.slice(((offset + 1) % 4) * 3, ((offset + 1) % 4) * 3 + 3);
  return { choices, extras };
}

export interface VerseArtworkSession { ids: string[]; replacements: number }
export function initialVerseArtwork(day: string): VerseArtworkSession {
  return { ids: dailyVerseArtwork(day).choices.map(style => style.id), replacements: 0 };
}

export function replaceVerseArtwork(day: string, session: VerseArtworkSession, slot: number): VerseArtworkSession {
  if (session.replacements >= EXTRA_IMAGE_LIMIT || slot < 0 || slot > 2) return session;
  const next = dailyVerseArtwork(day).extras[session.replacements];
  if (!next) return session;
  return { ids: session.ids.map((id, index) => index === slot ? next.id : id), replacements: session.replacements + 1 };
}

export function restoreVerseArtwork(day: string, raw: string | null): VerseArtworkSession {
  if (raw) {
    try {
      const state = JSON.parse(raw) as VerseArtworkSession;
      const allowed = [...dailyVerseArtwork(day).choices, ...dailyVerseArtwork(day).extras].map(style => style.id);
      if (Number.isInteger(state.replacements) && state.replacements >= 0 && state.replacements <= 3 &&
          Array.isArray(state.ids) && state.ids.length === 3 && new Set(state.ids).size === 3 && state.ids.every(id => allowed.includes(id))) return state;
    } catch { /* Ignore stale or unavailable browser storage. */ }
  }
  return initialVerseArtwork(day);
}