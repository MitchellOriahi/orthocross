import { test, expect } from "bun:test";
import {
  INITIAL_CANCEL_STEP,
  nextCancelStep,
} from "./donationCancellation.ts";

test("one confirmation requests cancellation without a pause detour", () => {
  expect(nextCancelStep("confirm", "cancel")).toBe("confirm");
});

test("server-confirmed cancellation shows the thank-you", () => {
  expect(nextCancelStep("confirm", "cancel_final")).toBe("thanks");
});

test("keeping or closing returns the donor to the first screen", () => {
  expect(nextCancelStep("thanks", "close")).toBe(INITIAL_CANCEL_STEP);
  expect(nextCancelStep("confirm", "close")).toBe(INITIAL_CANCEL_STEP);
  expect(nextCancelStep("confirm", "keep")).toBe("confirm");
});
