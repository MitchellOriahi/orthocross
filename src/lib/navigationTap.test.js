import { expect, test } from "bun:test";
import { isNavigationTap, trackNavigationMovement } from "./navigationTap";

const start = { pointerId: 1, x: 100, y: 100, path: "/friends", cancelled: false };

test("a stationary first tap activates its navigation destination", () => {
  expect(isNavigationTap(start, 1, "/friends", 103, 102)).toBe(true);
});

test("swiping left or right never activates navigation", () => {
  expect(isNavigationTap(start, 1, "/friends", 60, 100)).toBe(false);
  expect(isNavigationTap(start, 1, "/friends", 140, 100)).toBe(false);
});

test("a swipe returning to its starting position stays cancelled", () => {
  const moved = trackNavigationMovement(start, 100, 140);
  expect(isNavigationTap(moved, 1, "/friends", 100, 100)).toBe(false);
});

test("cancelled gestures and different pointers or destinations cannot navigate", () => {
  expect(isNavigationTap(null, 1, "/friends", 100, 100)).toBe(false);
  expect(isNavigationTap(start, 2, "/friends", 100, 100)).toBe(false);
  expect(isNavigationTap(start, 1, "/dashboard", 100, 100)).toBe(false);
});