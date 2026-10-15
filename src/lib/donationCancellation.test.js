import { test, expect } from "bun:test";
import {
  INITIAL_CANCEL_STEP,
  nextCancelStep,
} from "./donationCancellation.ts";

test("cancelling goes straight to the thank-you step", () => {
  expect(nextCancelStep("confirm", "cancel")).toBe("thanks");
});

test("no action ever sends a cancelling donor to a pause step", () => {
  const actions = ["keep", "cancel", "close", "pause", "pause_1_month", "maybe"];
  for (const action of actions) {
    const next = String(nextCancelStep("confirm", action));
    expect(next).not.toMatch(/pause/i);
    expect(next === "confirm" || next === "thanks").toBe(true);
  }
});

test("keeping or closing returns the donor to the first screen", () => {
  expect(nextCancelStep("thanks", "close")).toBe(INITIAL_CANCEL_STEP);
  expect(nextCancelStep("confirm", "keep")).toBe("confirm");
});
