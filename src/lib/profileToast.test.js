import { describe, expect, test } from "bun:test";
import { PROFILE_UPDATED_TOAST, PROFILE_UPDATED_TOAST_MS } from "./profileToast";

describe("profile updated sticker", () => {
  test("dismisses itself after 3 seconds, one second sooner", () => {
    expect(PROFILE_UPDATED_TOAST_MS).toBe(3000);
    expect(PROFILE_UPDATED_TOAST.duration).toBe(3000);
  });
});
