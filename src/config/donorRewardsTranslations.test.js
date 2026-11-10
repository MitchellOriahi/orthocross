import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { DONOR_REWARDS } from "./donorRewards";

for (const language of ["am", "ar", "bg", "el", "es", "fr", "he", "hy", "ka", "ml", "pt", "ro", "ru", "sr", "ti", "uk"]) {
  test(`${language} retains every offered prayer-rope knot count`, () => {
    const dict = JSON.parse(readFileSync(new URL(`../../public/i18n/${language}.json`, import.meta.url), "utf8"));
    for (const key of ["throne", "cherub", "seraph"]) {
      const reward = DONOR_REWARDS[key].find(r => r.kind === "rope");
      expect(reward?.knots).toBeDefined();
      const localized = dict[reward?.text ?? ""];
      expect(typeof localized).toBe("string");
      expect(localized).toContain(String(reward?.knots));
    }
  });
}
for (const language of ["am", "ar", "bg", "el", "es", "fr", "he", "hy", "ka", "ml", "pt", "ro", "ru", "sr", "ti", "uk"]) {
  test(`${language} translates every creator-drawn reward`, () => {
    const dict = JSON.parse(readFileSync(new URL(`../../public/i18n/${language}.json`, import.meta.url), "utf8"));
    for (const reward of Object.values(DONOR_REWARDS).flat().filter(r => r.kind === "drawing")) {
      expect(typeof dict[reward.text]).toBe("string");
    }
  });
}
