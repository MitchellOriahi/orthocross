import { describe, expect, test } from "bun:test";
import { parseCategoryIconStyle, CATEGORY_ICON_STYLE_LABELS, setCategoryIconStyle, getCategoryIconStyle, hasManualCategoryIconStyle } from "./useCategoryIconStyle";

test("category styles accept the three requested traditions and preserve Greek", () => {
  for (const value of ["original", "tewahedo", "coptic", "byzantine"]) expect(parseCategoryIconStyle(value)).toBe(value);
});
test("the first style is labelled Greek and still stores the original key", () => {
  expect(CATEGORY_ICON_STYLE_LABELS.original).toBe("Greek");
  expect(parseCategoryIconStyle("original")).toBe("original");
});
test("the fourth style is labelled Russian and still stores the byzantine key", () => {
  expect(CATEGORY_ICON_STYLE_LABELS.byzantine).toBe("Russian");
  expect(parseCategoryIconStyle("byzantine")).toBe("byzantine");
});
test("missing or unknown image preferences restore Greek artwork", () => {
  expect(parseCategoryIconStyle(null)).toBe("original");
  expect(parseCategoryIconStyle("unknown")).toBe("original");
});

describe("each section keeps its own icon style", () => {
  function stubStorage() {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } };
    return store;
  }
  test("changing Prayers leaves Saints as it was, and the other way round", () => {
    stubStorage();
    setCategoryIconStyle("saints", "coptic", { manual: true });
    setCategoryIconStyle("prayers", "byzantine", { manual: true });
    setCategoryIconStyle("prayers", "tewahedo", { manual: true });
    expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
    expect(getCategoryIconStyle("saints")).toBe("coptic");
    setCategoryIconStyle("saints", "original", { manual: true });
    expect(getCategoryIconStyle("saints")).toBe("original");
    expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
    expect(hasManualCategoryIconStyle("saints")).toBe(true);
    expect(hasManualCategoryIconStyle("prayers")).toBe(true);
  });
  test("a style picked before the sections were separated carries over to both", () => {
    stubStorage();
    localStorage.setItem("category-icon-style", "byzantine");
    localStorage.setItem("category-icon-style-manual", "true");
    expect(getCategoryIconStyle("saints")).toBe("byzantine");
    expect(getCategoryIconStyle("prayers")).toBe("byzantine");
    expect(hasManualCategoryIconStyle("saints")).toBe(true);
    setCategoryIconStyle("prayers", "coptic", { manual: true });
    expect(getCategoryIconStyle("saints")).toBe("byzantine");
    expect(getCategoryIconStyle("prayers")).toBe("coptic");
  });
});
