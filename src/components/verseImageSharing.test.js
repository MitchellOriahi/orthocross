import { afterEach, describe, expect, mock, test } from "bun:test";

let native = true;
const writeFile = mock(async () => ({ uri: "file:///cache/verse.png" }));
const share = mock(async () => ({}));
const registerPlugin = mock(name => name === "Share" ? { share } : { writeFile });
mock.module("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => native },
  registerPlugin,
}));
const { shareVerseImage } = await import("./verseImageSharing");

afterEach(() => {
  native = true;
  writeFile.mockClear();
  share.mockReset();
  share.mockImplementation(async () => ({}));
  registerPlugin.mockClear();
});

describe("native verse image sharing", () => {
  test("registers bridge plugins and sends only the cached image attachment", async () => {
    expect(await shareVerseImage("data:image/png;base64,aW1hZ2U=", "verse.png")).toBe("shared");
    expect(registerPlugin.mock.calls).toEqual([["Share"], ["Filesystem"]]);
    expect(writeFile.mock.calls[0][0]).toMatchObject({ data: "aW1hZ2U=", directory: "CACHE" });
    expect(writeFile.mock.calls[0][0].path).toEndWith("verse.png");
    expect(share.mock.calls).toEqual([[{ files: ["file:///cache/verse.png"] }]]);
  });

  test("dismissing the iPhone share sheet is not a sharing failure", async () => {
    share.mockImplementation(async () => { throw new Error("Share canceled"); });
    expect(await shareVerseImage("data:image/png;base64,aW1hZ2U=", "verse.png")).toBe("cancelled");
  });

  test("real native errors are not reported as successful sharing", async () => {
    share.mockImplementation(async () => { throw new Error("Plugin unavailable"); });
    await expect(shareVerseImage("data:image/png;base64,aW1hZ2U=", "verse.png")).rejects.toThrow("Plugin unavailable");
  });

  test("a failing native plugin falls back to the WebView share sheet with the image file", async () => {
    share.mockImplementation(async () => { throw new Error("Plugin unavailable"); });
    const webShare = mock(async () => {});
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", { value: { share: webShare, canShare: () => true }, configurable: true });
    try {
      expect(await shareVerseImage("data:image/png;base64,aW1hZ2U=", "verse.png")).toBe("shared");
      expect(webShare.mock.calls[0][0].files[0].name).toBe("verse.png");
    } finally {
      Object.defineProperty(globalThis, "navigator", { value: original, configurable: true });
    }
  });

  test("an invalid attachment never opens the native share sheet", async () => {
    await expect(shareVerseImage("", "verse.png")).rejects.toThrow("could not be attached");
    expect(writeFile).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
  });
});