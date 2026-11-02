import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { getSaintRelationship } from "./saintRelationship";
import { saintAssociationPairs } from "./saintAssociations";
import evidence from "./saintAssociationEvidence.json";

test("each dropdown explains the same evidence-backed connection from either saint", () => {
  for (const [a, b] of saintAssociationPairs) {
    const passage = evidence.find(entry => entry.a === a && entry.b === b)?.quote;
    expect(getSaintRelationship(a, b)).toBe(passage);
    expect(getSaintRelationship(b, a)).toBe(passage);
  }
  expect(getSaintRelationship("abel", "adam")).toContain("second son of Adam and Eve");
  expect(getSaintRelationship("missing-saint", "adam")).toBeUndefined();
});

test("all connection explanations already exist in every supported translation", () => {
  for (const lang of ["am", "ar", "hy", "bg", "fr", "ka", "el", "he", "ml", "pt", "ro", "ru", "sr", "es", "ti", "uk"]) {
    const dictionary = JSON.parse(readFileSync(new URL(`../../public/i18n/${lang}.json`, import.meta.url), "utf8"));
    for (const entry of evidence) {
      expect(typeof dictionary[entry.quote]).toBe("string");
      expect(dictionary[entry.quote].trim().length).toBeGreaterThan(0);
      expect(dictionary[entry.quote]).not.toBe(entry.quote);
    }
  }
});