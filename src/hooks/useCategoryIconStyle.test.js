import { expect, test } from "bun:test";
import { parseCategoryIconStyle } from "./useCategoryIconStyle";

test("category styles accept the three requested traditions and preserve Original", () => {
  for (const value of ["original", "tewahedo", "coptic", "byzantine"]) expect(parseCategoryIconStyle(value)).toBe(value);
});
test("missing or unknown image preferences restore original artwork", () => {
  expect(parseCategoryIconStyle(null)).toBe("original");
  expect(parseCategoryIconStyle("unknown")).toBe("original");
});