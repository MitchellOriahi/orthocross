import golden from "@/assets/verse-backgrounds/golden.asset.json";
import pilgrim from "@/assets/verse-backgrounds/pilgrim.asset.json";
import midnight from "@/assets/verse-backgrounds/midnight.asset.json";
import mountain from "@/assets/verse-backgrounds/mountain.asset.json";
import sea from "@/assets/verse-backgrounds/sea.asset.json";
import desert from "@/assets/verse-backgrounds/desert.asset.json";
import river from "@/assets/verse-backgrounds/river.asset.json";
import forest from "@/assets/verse-backgrounds/forest.asset.json";
import flowers from "@/assets/verse-backgrounds/flowers.asset.json";
import moon from "@/assets/verse-backgrounds/moon.asset.json";
import aurora from "@/assets/verse-backgrounds/aurora.asset.json";
import night from "@/assets/verse-backgrounds/night.asset.json";

export const VERSE_PHOTO_BACKGROUNDS: Record<string, string> = {
  golden: golden.url,
  pilgrim: pilgrim.url,
  midnight: midnight.url,
  mountain: mountain.url,
  sea: sea.url,
  desert: desert.url,
  river: river.url,
  forest: forest.url,
  flowers: flowers.url,
  moon: moon.url,
  aurora: aurora.url,
  night: night.url,
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