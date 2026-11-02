import type { SharePlugin } from "@capacitor/share";
import type { FilesystemPlugin } from "@capacitor/filesystem";

export const imageSharePayload = (file: File): ShareData => ({ files: [file] });

export const downloadVerseImage = (imageUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const isCancel = (error: unknown) =>
  error instanceof Error && (error.name === "AbortError" || /cancel/i.test(error.message));

const imageFile = async (imageUrl: string, filename: string) => {
  const blob = await (await fetch(imageUrl)).blob();
  return new File([blob], filename, { type: "image/png" });
};

// WKWebView (iOS 15+) supports sharing files through the Web Share API, so it
// rescues builds whose native Share/Filesystem plugins are missing or failing.
const tryWebShare = async (imageUrl: string, filename: string) => {
  if (typeof navigator === "undefined" || !navigator.share) return null;
  const payload = imageSharePayload(await imageFile(imageUrl, filename));
  if (navigator.canShare && !navigator.canShare(payload)) return null;
  try {
    await navigator.share(payload);
    return "shared" as const;
  } catch (error) {
    if (isCancel(error)) return "cancelled" as const;
    throw error;
  }
};

const shareNatively = async (imageUrl: string, filename: string) => {
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  // Use the bundled bridge: a WebView cannot resolve bare npm module paths.
  const Share = registerPlugin<SharePlugin>("Share");
  const Filesystem = registerPlugin<FilesystemPlugin>("Filesystem");
  if (Capacitor.isPluginAvailable && (!Capacitor.isPluginAvailable("Share") || !Capacitor.isPluginAvailable("Filesystem"))) {
    throw new Error("Native sharing is unavailable in this build.");
  }
  const base64 = imageUrl.split(",")[1];
  const { uri } = await Filesystem.writeFile({
    path: `verse-${Date.now()}-${filename}`,
    data: base64,
    directory: "CACHE" as import("@capacitor/filesystem").Directory,
  });
  try {
    await Share.share({ files: [uri] });
  } catch (error) {
    if (isCancel(error)) return "cancelled" as const;
    throw error;
  }
  return "shared" as const;
};

export const shareVerseImage = async (imageUrl: string, filename: string) => {
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    if (!imageUrl.split(",")[1]) throw new Error("The image could not be attached.");
    try {
      return await shareNatively(imageUrl, filename);
    } catch (nativeError) {
      const fallback = await tryWebShare(imageUrl, filename).catch(() => null);
      if (fallback) return fallback;
      throw nativeError;
    }
  }
  const outcome = await tryWebShare(imageUrl, filename);
  if (outcome) return outcome;
  downloadVerseImage(imageUrl, filename);
  return "downloaded";
};