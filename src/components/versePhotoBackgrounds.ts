import golden from "@/assets/verse-backgrounds/golden.asset.json";
import pilgrim from "@/assets/verse-backgrounds/pilgrim.asset.json";
import midnight from "@/assets/verse-backgrounds/midnight.asset.json";

export const VERSE_PHOTO_BACKGROUNDS: Record<string, string> = {
  golden: golden.url,
  pilgrim: pilgrim.url,
  midnight: midnight.url,
};

const loaded = new Map<string, Promise<HTMLImageElement>>();

export function loadVerseBackground(styleId: string): Promise<HTMLImageElement> {
  const cached = loaded.get(styleId);
  if (cached) return cached;
  const url = VERSE_PHOTO_BACKGROUNDS[styleId];
  if (!url) return Promise.reject(new Error("Unknown verse background."));
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      loaded.delete(styleId);
      reject(new Error("The photo could not be loaded. Please try again."));
    };
    image.src = url;
  });
  loaded.set(styleId, promise);
  return promise;
}

export function preloadVerseBackgrounds() {
  for (const id of Object.keys(VERSE_PHOTO_BACKGROUNDS)) {
    void loadVerseBackground(id).catch(() => undefined);
  }
}