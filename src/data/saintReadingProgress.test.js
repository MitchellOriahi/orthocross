import { expect, test } from "bun:test";
import { saintPageRoster, getSaintStoryReturnMembership } from "./saintPageRoster";
import { completedSaintIds, allSaintStoriesCompleted, earnsAllSaintsAward } from "./saintReadingProgress";

test("completion belongs to the exact saint, not every saint sharing a first name", () => {
  const josephs = saintPageRoster.filter(saint => saint.name.includes("Joseph"));
  expect(josephs.length).toBeGreaterThan(1);
  const completed = completedSaintIds([{ saint_id: josephs[0].id }, { saint_id: josephs[0].id }]);
  expect(completed.size).toBe(1);
  expect(completed.has(josephs[0].id)).toBe(true);
  expect(completed.has(josephs[1].id)).toBe(false);
});
test("every unique story is required even when all but one are complete", () => {
  const all = new Set(saintPageRoster.map(saint => saint.id));
  const partial = new Set(all);
  partial.delete(saintPageRoster[0].id);
  partial.add("unrelated-story");
  expect(allSaintStoriesCompleted(partial)).toBe(false);
  expect(allSaintStoriesCompleted(all)).toBe(true);
});
test("the award is earned on the final unique completion, not on rereading", () => {
  const all = new Set(saintPageRoster.map(saint => saint.id));
  const partial = new Set(all);
  partial.delete(saintPageRoster[0].id);
  expect(earnsAllSaintsAward(partial, all)).toBe(true);
  expect(earnsAllSaintsAward(all, all)).toBe(false);
  expect(earnsAllSaintsAward(new Set(), partial)).toBe(false);
});

test("John of Damascus completion returns to his Theologians subcategory even from a general search", () => {
  expect(getSaintStoryReturnMembership("saint-john-damascus", null, null)).toEqual({ category: "fathers", subgroup: "Theologians" });
});

test("completion preserves a shared saint's selected subcategory", () => {
  expect(getSaintStoryReturnMembership("seraphim", "angels", "Heavenly Orders")).toEqual({ category: "angels", subgroup: "Heavenly Orders" });
});