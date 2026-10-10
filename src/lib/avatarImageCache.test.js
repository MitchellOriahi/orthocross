import { describe, expect, test } from "bun:test";
import { getCachedPortrait, portraitRetrySource } from "./avatarImageCache.ts";

describe("portrait recovery", () => {
  test("retry uses a fresh request while keeping the original source intact", () => {
    const source = "https://example.org/portrait.jpg?version=2";
    expect(portraitRetrySource(source, 0)).toBe(source);
    const retry = new URL(portraitRetrySource(source, 2));
    expect(retry.searchParams.get("version")).toBe("2");
    expect(retry.searchParams.get("portrait_retry")).toBe("2");
    expect(portraitRetrySource(source, 1)).not.toBe(portraitRetrySource(source, 2));
  });
  test("local image URLs are not altered or fetched", async () => {
    expect(portraitRetrySource("blob:local-portrait", 3)).toBe("blob:local-portrait");
    expect(await getCachedPortrait("data:image/png;base64,abc")).toBeUndefined();
  });
});