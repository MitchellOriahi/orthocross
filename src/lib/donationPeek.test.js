import { describe, expect, test } from "bun:test";
import { donationPeekHeight, observeDonationPeek } from "./donationPeek";

describe("donation opening peek", () => {
  test("sets the half-slider height immediately without waiting for a resize", () => {
    const previous = {
      window: globalThis.window,
      ResizeObserver: globalThis.ResizeObserver,
      HTMLInputElement: globalThis.HTMLInputElement,
    };
    let dispose;
    try {
      class Input {}
      globalThis.HTMLInputElement = Input;
      globalThis.ResizeObserver = class {
        observe() {}
        disconnect() {}
      };
      globalThis.window = {
        innerHeight: 763,
        addEventListener() {},
        removeEventListener() {},
        requestAnimationFrame() { throw new Error("Opening must not wait for a frame"); },
      };
      const content = { style: {}, children: [], querySelector: () => slider };
      const slider = Object.assign(new Input(), {
        offsetTop: 500, offsetHeight: 16, offsetParent: content,
      });
      dispose = observeDonationPeek(content);
      expect(content.style.maxHeight).toBe("508px");
    } finally {
      dispose?.();
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    }
  });
  test("places the opening edge at half of the price slider", () => {
    expect(donationPeekHeight(100, 600, 16, 0, 763)).toBe(508);
  });
  test("scrolling to tiers cannot shrink the donation window", () => {
    const opening = donationPeekHeight(100, 600, 16, 0, 763);
    expect(donationPeekHeight(100, 200, 16, 400, 763)).toBe(opening);
    expect(donationPeekHeight(100, -200, 16, 800, 763)).toBe(opening);
  });
  test("moving the centered dialog after a tier selection does not change its height", () => {
    expect(donationPeekHeight(150, 650, 16, 0, 763)).toBe(508);
  });
  test("leaves screen clearance when translated content is taller than the viewport", () => {
    expect(donationPeekHeight(0, 1000, 16, 0, 763)).toBe(731);
  });
});