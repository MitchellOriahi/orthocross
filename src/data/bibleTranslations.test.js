import { beforeEach, expect, test } from "bun:test";

const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
const { getTranslationsForLanguage, getUserPreferredTranslation } = await import("./bibleTranslations");

beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

test("French offers the OSB plus French Bibles only, never English-only ones like the ASV", () => {
  const ids = getTranslationsForLanguage("fr").map(t => t.id);
  expect(ids).toEqual(["osb", "fr-lsg"]);
  expect(ids).not.toContain("asv");
});

test("English keeps the OSB and the English Bibles, without other-language Bibles", () => {
  const ids = getTranslationsForLanguage("en").map(t => t.id);
  expect(ids[0]).toBe("osb");
  expect(ids).toContain("asv");
  expect(ids).not.toContain("ar-svd");
});

test("choosing Arabic makes the Arabic Bible the main Bible", () => {
  store["orthocross-language"] = "ar";
  expect(getUserPreferredTranslation().id).toBe("ar-svd");
});

test("a language without its own Bible falls back to the OSB", () => {
  store["orthocross-language"] = "am";
  expect(getTranslationsForLanguage("am").map(t => t.id)).toEqual(["osb"]);
  expect(getUserPreferredTranslation().id).toBe("osb");
});

test("a saved English-only Bible is not used once another language is chosen", () => {
  store["orthocross-language"] = "ru";
  store.preferredBibleTranslation = "asv";
  expect(getUserPreferredTranslation().id).toBe("ru-synod");
});
