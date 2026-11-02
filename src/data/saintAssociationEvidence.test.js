import { expect, test } from "bun:test";
import stories from "./saintStories.json";
import evidence from "./saintAssociationEvidence.json";

test("every published association is supported by an unchanged existing story passage", () => {
  expect(evidence.length).toBeGreaterThan(0);
  for (const entry of evidence) {
    const paragraph = stories[entry.sourceStoryId]?.[entry.paragraphIndex];
    expect(typeof paragraph).toBe("string");
    expect(entry.quote.length).toBeGreaterThan(10);
    expect(paragraph?.includes(entry.quote)).toBe(true);
  }
});