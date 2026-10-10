// Keep successful portraits on this device so navigation and temporary outages
// do not require downloading the same image again. Keys remain source-specific.
const CACHE_NAME = "orthocross-portraits-v1";
const MAX_PORTRAITS = 64;

export async function getCachedPortrait(src: string): Promise<Blob | undefined> {
  if (!src.startsWith("http") || typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(src);
    if (saved) return await saved.blob();
    const response = await fetch(src, { credentials: "omit" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) return;
    const blob = await response.clone().blob();
    if (!blob.size) return;
    await cache.put(src, response);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_PORTRAITS)).map(key => cache.delete(key)));
    return blob;
  } catch {
    // Direct image loading and bounded retries still work without cache access.
    return;
  }
}

export function portraitRetrySource(src: string, attempt: number): string {
  if (!attempt || !src.startsWith("http")) return src;
  const url = new URL(src);
  url.searchParams.set("portrait_retry", String(attempt));
  return url.toString();
}