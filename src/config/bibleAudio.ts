/** Voice names double as storage folder names in the bible-audio bucket. */
export const BIBLE_AUDIO_VOICES = { male: "male", female: "female" } as const;
export type BibleAudioVoice = keyof typeof BIBLE_AUDIO_VOICES;

export const BIBLE_AUDIO_BUCKET = "bible-audio";
export const BIBLE_AUDIO_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export const bookSlug = (book: string) =>
  book.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** {translation}/{voice}/{book-slug}/{chapter}.{ext} */
export const chapterAudioPath = (
  translation: string, voice: BibleAudioVoice, book: string, chapter: number, ext: "mp3" | "json",
) => `${translation.toLowerCase()}/${BIBLE_AUDIO_VOICES[voice]}/${bookSlug(book)}/${chapter}.${ext}`;
