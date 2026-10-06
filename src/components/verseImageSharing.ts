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
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    const sharePath = ["@capacitor", "share"].join("/");
    const filesystemPath = ["@capacitor", "filesystem"].join("/");
    const { Share } = await import(/* @vite-ignore */ sharePath);
    const { Filesystem, Directory } = await import(/* @vite-ignore */ filesystemPath);
    const base64 = imageUrl.split(",")[1];
    if (!base64) throw new Error("The image could not be attached.");
    const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
    await Share.share({ files: [uri] });
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