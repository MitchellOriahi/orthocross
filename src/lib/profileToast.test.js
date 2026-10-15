import { describe, expect, test } from "bun:test";
import { PROFILE_UPDATED_TOAST, PROFILE_UPDATED_TOAST_MS } from "./profileToast";

describe("profile updated sticker", () => {
  test("dismisses itself after 4 seconds", () => {
    expect(PROFILE_UPDATED_TOAST_MS).toBe(4000);
    expect(PROFILE_UPDATED_TOAST.duration).toBe(4000);
  });
});
