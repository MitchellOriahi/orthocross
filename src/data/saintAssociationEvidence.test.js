import { expect, test } from "bun:test";
import stories from "./saintStories.json";
import evidence from "./saintAssociationEvidence.json";
import { saintAssociationPairs } from "./saintAssociations";

test("every published association is supported by an unchanged existing story passage", () => {
  expect(evidence.length).toBeGreaterThan(0);
  expect(evidence.map(entry => [entry.a, entry.b])).toEqual(saintAssociationPairs);
  for (const entry of evidence) {
    const paragraph = stories[entry.sourceStoryId]?.[entry.paragraphIndex];
    expect(typeof paragraph).toBe("string");
    expect(entry.quote.length).toBeGreaterThan(10);
    expect(paragraph?.includes(entry.quote)).toBe(true);
  }
});