import { expect, test } from "bun:test";
import { donorDuration } from "./donorDuration";

test("one confirmed donation counts as one month", () => {
  expect(donorDuration(1)).toEqual({ unit: "month", count: 1 });
});
test("twelve confirmed donations count as one year", () => {
  expect(donorDuration(12)).toEqual({ unit: "year", count: 1 });
});
test("twenty-four confirmed donations count as two years", () => {
  expect(donorDuration(24)).toEqual({ unit: "year", count: 2 });
});
test("uses months below twelve and whole years thereafter", () => {
  expect(donorDuration(11)).toEqual({ unit: "month", count: 11 });
  expect(donorDuration(23)).toEqual({ unit: "year", count: 1 });
});
test("missing or invalid donation counts never invent tenure", () => {
  for (const count of [null, undefined, 0, -1, 1.5, NaN]) {
    expect(donorDuration(count)).toBeNull();
  }
});