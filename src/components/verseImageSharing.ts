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

export const shareVerseImage = async (imageUrl: string, filename: string) => {
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    // Use the bundled bridge: a WebView cannot resolve bare npm module paths.
    const Share = registerPlugin<SharePlugin>("Share");
    const Filesystem = registerPlugin<FilesystemPlugin>("Filesystem");
    const base64 = imageUrl.split(",")[1];
    if (!base64) throw new Error("The image could not be attached.");
    const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: "CACHE" as import("@capacitor/filesystem").Directory });
    try {
      await Share.share({ files: [uri] });
    } catch (error) {
      if (error instanceof Error && /^(Share canceled|Share cancelled)$/.test(error.message)) {
        return "cancelled";
      }
      throw error;
    }
    return "shared";
  }
  const blob = await (await fetch(imageUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });
  const payload = imageSharePayload(file);
  if (navigator.share && navigator.canShare?.(payload)) {
    await navigator.share(payload);
    return "shared";
  }
  downloadVerseImage(imageUrl, filename);
  return "downloaded";
};