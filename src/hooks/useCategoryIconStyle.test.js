import { expect, test } from "bun:test";
import { parseCategoryIconStyle, CATEGORY_ICON_STYLE_LABELS } from "./useCategoryIconStyle";

test("category styles accept the three requested traditions and preserve Greek", () => {
  for (const value of ["original", "tewahedo", "coptic", "byzantine"]) expect(parseCategoryIconStyle(value)).toBe(value);
});
test("the first style is labelled Greek and still stores the original key", () => {
  expect(CATEGORY_ICON_STYLE_LABELS.original).toBe("Greek");
  expect(parseCategoryIconStyle("original")).toBe("original");
});
test("missing or unknown image preferences restore Greek artwork", () => {
  expect(parseCategoryIconStyle(null)).toBe("original");
  expect(parseCategoryIconStyle("unknown")).toBe("original");
});