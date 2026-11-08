import { expect, test } from "bun:test";
import { orientationConfirmAction } from "./orientationConfirm";

test("nothing happens on Confirm before a tradition is chosen", () => {
  expect(orientationConfirmAction("family", null, null)).toBeNull();
});

test("confirming Eastern or Oriental opens that church list", () => {
  expect(orientationConfirmAction("family", "eastern", null)).toEqual({ type: "step", step: "eastern" });
  expect(orientationConfirmAction("family", "oriental", null)).toEqual({ type: "step", step: "oriental" });
});

test("confirming Just Exploring finishes without a church", () => {
  expect(orientationConfirmAction("family", "unaffiliated", null)).toEqual({ type: "neither" });
});

test("a church is saved only after it is selected and confirmed", () => {
  expect(orientationConfirmAction("eastern", null, null)).toBeNull();
  expect(orientationConfirmAction("eastern", null, "Greek Orthodox")).toEqual({ type: "save", branch: "Greek Orthodox" });
});
