import { dailyVerseArtwork, verseArtworkDay } from "@/components/verseImageStyles";

const loaded = new Map<string, Promise<HTMLImageElement>>();

export function loadVerseBackground(url: string): Promise<HTMLImageElement> {
  const cached = loaded.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      loaded.delete(url);
      reject(new Error("The photo could not be loaded. Please try again."));
    };
    image.src = url;
  });
  loaded.set(url, promise);
  return promise;
}

/** Preload only today's three photos. */
export function preloadVerseBackgrounds(day = verseArtworkDay()) {
  for (const style of dailyVerseArtwork(day)) void loadVerseBackground(style.url).catch(() => undefined);
}
