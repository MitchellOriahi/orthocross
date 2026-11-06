import { expect, test } from "bun:test";
import { donorDuration } from "./donorDuration";

test("reports completed donation months before a year", () => {
  expect(donorDuration("2026-08-06T12:00:00Z", new Date("2026-11-06T12:00:00Z"))).toEqual({ unit: "month", count: 3 });
});
test("switches to years at twelve completed months", () => {
  expect(donorDuration("2025-11-06T12:00:00Z", new Date("2026-11-06T12:00:00Z"))).toEqual({ unit: "year", count: 1 });
});
test("does not round incomplete years up", () => {
  expect(donorDuration("2024-12-06T12:00:00Z", new Date("2026-11-06T12:00:00Z"))).toEqual({ unit: "year", count: 1 });
});
test("new donors have not yet completed a month", () => {
  expect(donorDuration("2026-11-05T12:00:00Z", new Date("2026-11-06T12:00:00Z"))).toEqual({ unit: "month", count: 0 });
});
test("missing, invalid and future history never invents tenure", () => {
  for (const start of [null, undefined, "invalid", "2027-11-06"]) {
    expect(donorDuration(start, new Date("2026-11-06T12:00:00Z"))).toBeNull();
  }
});