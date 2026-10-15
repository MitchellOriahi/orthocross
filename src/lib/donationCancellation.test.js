import { test, expect } from "bun:test";
import {
  INITIAL_CANCEL_STEP,
  nextCancelStep,
} from "./donationCancellation.ts";

test("the first cancellation attempt offers a pause instead of cancelling", () => {
  expect(nextCancelStep("confirm", "cancel")).toBe("pause");
});

test("declining the pause cancels for real and shows the thank-you", () => {
  expect(nextCancelStep("pause", "cancel_final")).toBe("thanks");
});

test("keeping or closing returns the donor to the first screen", () => {
  expect(nextCancelStep("thanks", "close")).toBe(INITIAL_CANCEL_STEP);
  expect(nextCancelStep("pause", "close")).toBe(INITIAL_CANCEL_STEP);
  expect(nextCancelStep("confirm", "keep")).toBe("confirm");
});
