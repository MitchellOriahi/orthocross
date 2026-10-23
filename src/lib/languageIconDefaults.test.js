import { afterEach, beforeEach, expect, test } from "bun:test";
import { applyBranchPreferences, applyLanguageIconDefaults, iconStyleForLanguage } from "./orthodoxOrientation";
import { getCategoryIconStyle, setCategoryIconStyle } from "../hooks/useCategoryIconStyle";

let oldStorage;
let oldWindow;
beforeEach(() => {
  oldStorage = globalThis.localStorage;
  oldWindow = globalThis.window;
  const values = new Map();
  globalThis.localStorage = {
    getItem: k => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: k => values.delete(k),
  };
  globalThis.window = { dispatchEvent() { return true; } };
});
afterEach(() => {
  globalThis.localStorage = oldStorage;
  globalThis.window = oldWindow;
});

for (const [language, style] of [
  ["am", "tewahedo"], ["ti", "tewahedo"],
  ["ar", "coptic"], ["cop", "coptic"], ["hy", "original"], ["ml", "original"],
  ["ru", "byzantine"], ["uk", "original"], ["bg", "original"], ["sr", "original"],
  ["el", "original"], ["ka", "original"], ["ro", "original"],
  ["en", "original"], ["es", "original"], ["pt", "original"], ["fr", "original"], ["he", "original"],
]) {
  test(`${language} uses ${style} in both sections without a branch`, () => {
    expect(iconStyleForLanguage(language)).toBe(style);
    applyLanguageIconDefaults(language, null);
    expect(getCategoryIconStyle("saints")).toBe(style);
    expect(getCategoryIconStyle("prayers")).toBe(style);
  });
}
for (const [branch, style] of [
  ["Coptic", "coptic"], ["Greek Orthodox", "original"],
  ["Russian Orthodox", "byzantine"], ["Ethiopian Tewahedo", "tewahedo"],
  ["Eritrean Tewahedo", "tewahedo"], ["Armenian Apostolic", "original"],
  ["Syriac Orthodox", "original"], ["Malankara Orthodox", "original"],
  ["Serbian Orthodox", "original"], ["Ukrainian Orthodox", "original"],
  ["Bulgarian Orthodox", "original"],
]) {
  test(`${branch} defaults both sections to ${style} regardless of language`, () => {
    applyLanguageIconDefaults("am", null);
    applyBranchPreferences(branch, { force: true });
    applyLanguageIconDefaults("ru", branch);
    expect(getCategoryIconStyle("saints")).toBe(style);
    expect(getCategoryIconStyle("prayers")).toBe(style);
  });
}
test("no language choice falls back to Greek", () => {
  setCategoryIconStyle("saints", "tewahedo");
  applyLanguageIconDefaults(undefined, null);
  expect(getCategoryIconStyle("saints")).toBe("original");
  expect(getCategoryIconStyle("prayers")).toBe("original");
});
test("neutral language replaces previous automatic defaults with Greek", () => {
  applyLanguageIconDefaults("am", null);
  applyLanguageIconDefaults("en", null);
  expect(getCategoryIconStyle("saints")).toBe("original");
  expect(getCategoryIconStyle("prayers")).toBe("original");
});
test("an explicit branch takes priority over language", () => {
  setCategoryIconStyle("saints", "coptic");
  setCategoryIconStyle("prayers", "coptic");
  applyLanguageIconDefaults("ru", "Coptic");
  expect(getCategoryIconStyle("saints")).toBe("coptic");
  expect(getCategoryIconStyle("prayers")).toBe("coptic");
});
test("manual choices stay independent of language defaults", () => {
  setCategoryIconStyle("saints", "byzantine", { manual: true });
  applyLanguageIconDefaults("am", null);
  expect(getCategoryIconStyle("saints")).toBe("byzantine");
  expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
});
test("Inquirer is not an Orthodox branch and uses language defaults", () => {
  applyLanguageIconDefaults("ti", "Inquirer");
  expect(getCategoryIconStyle("saints")).toBe("tewahedo");
  expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
});