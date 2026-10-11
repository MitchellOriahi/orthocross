import { test, expect } from "bun:test";
import { buildWordTimeline, wordAtTime } from "./wordTiming";

test("highlight waits for speech onset and follows actual pauses rather than total WAV length", () => {
  const starts = buildWordTimeline(["one", "two", "six", "ten"], 3, [
    { start: 0.02, end: 1.02, active: true },
    { start: 1.02, end: 1.72, active: false },
    { start: 1.72, end: 2.72, active: true },
  ]);
  [0.02, 0.52, 1.72, 2.22].forEach((time, i) => expect(starts[i]).toBeCloseTo(time, 6));
  expect(wordAtTime(starts, 0)).toBe(-1);
  expect(wordAtTime(starts, 1.5)).toBe(1);
  expect(wordAtTime(starts, 1.72)).toBe(2);
});

test("short words receive an onset cost rather than raw character-only timing", () => {
  const starts = buildWordTimeline(["I", "beginning"], 2);
  expect(starts[1]).toBeCloseTo(2 * 202 / (202 + 698), 6);
});

test("speed, buffering and backward seeks use media time without a second speed multiplier", () => {
  const starts = [0.02, 0.5, 1.4, 2];
  expect(wordAtTime(starts, 1.5)).toBe(2);
  expect(wordAtTime(starts, 1.5)).toBe(2);
  expect(wordAtTime(starts, 0.6)).toBe(1);
  expect(wordAtTime(starts, 2.1)).toBe(3);
});