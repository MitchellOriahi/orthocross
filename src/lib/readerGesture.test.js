import { expect, test } from "bun:test";
import { startReaderGesture, moveReaderGesture, readerPageTurn, readerScrollDirection } from "./readerGesture";

const trace = (points) => points.reduce((g, [x, y]) => moveReaderGesture(g, x, y), startReaderGesture(200, 300));

test("fast upward and downward thumb arcs never turn pages", () => {
  expect(readerPageTurn(trace([[195, 280], [110, 100]]))).toBe(null);
  expect(readerPageTurn(trace([[195, 320], [110, 500]]))).toBe(null);
});
test("vertical intent stays locked even after a sideways finish", () => {
  expect(readerPageTurn(trace([[200, 280], [200, 150], [90, 300]]))).toBe(null);
});
test("intentional horizontal thumb arcs turn in both directions", () => {
  expect(readerPageTurn(trace([[180, 305], [100, 325]]))).toBe("next");
  expect(readerPageTurn(trace([[220, 305], [300, 275]]))).toBe("prev");
});
test("short or diagonal gestures do not turn pages", () => {
  expect(readerPageTurn(trace([[140, 300]]))).toBe(null);
  expect(readerPageTurn(trace([[100, 350]]))).toBe(null);
});
test("full vertical travel is retained even when a gesture returns", () => {
  expect(readerPageTurn(trace([[180, 300], [100, 240], [90, 300]]))).toBe(null);
});
test("scroll direction responds at eight pixels but ignores jitter", () => {
  expect(readerScrollDirection(100, 92, 1000)).toBe("show");
  expect(readerScrollDirection(100, 108, 1000)).toBe("hide");
  expect(readerScrollDirection(100, 96, 1000)).toBe(null);
});
test("top and bottom rubber-band bounces cannot reveal the bar", () => {
  expect(readerScrollDirection(-30, 0, 1000)).toBe(null);
  expect(readerScrollDirection(0, -30, 1000)).toBe(null);
  expect(readerScrollDirection(1030, 1000, 1000)).toBe(null);
  expect(readerScrollDirection(1000, 1030, 1000)).toBe(null);
});