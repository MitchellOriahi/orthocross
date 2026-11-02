import { expect, test } from "bun:test";
import { saintPageRoster } from "./saintPageRoster";
import { getAssociatedSaints, saintAssociationPairs } from "./saintAssociations";
import { completedSaintIds } from "./saintReadingProgress";

const ids = saintId => getAssociatedSaints(saintId).map(saint => saint.id);

test("associations open exact roster identities and never link a saint to themselves", () => {
  const roster = new Set(saintPageRoster.map(saint => saint.id));
  const seen = new Set();
  for (const [a, b] of saintAssociationPairs) {
    expect(roster.has(a)).toBe(true);
    expect(roster.has(b)).toBe(true);
    expect(a).not.toBe(b);
    const key = [a, b].sort().join(":");
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    expect(ids(a)).toContain(b);
    expect(ids(b)).toContain(a);
  }
});

test("family and missionary companions are discoverable from either story", () => {
  expect(ids("basil")).toContain("macrina-younger");
  expect(ids("basil")).toContain("emmelia");
  expect(ids("cyril")).toContain("methodius-slavs");
  expect(ids("perpetua")).toContain("felicity");
  expect(ids("martha-of-bethany")).toContain("mary-of-bethany");
});

test("namesake and contrast references do not create false connections", () => {
  expect(ids("daniel-the-stylite")).not.toContain("leo-the-great");
  expect(ids("george")).not.toContain("empress-alexandra");
  expect(ids("raphael")).not.toContain("sarah");
  expect(ids("philip")).not.toContain("philip-the-deacon");
  expect(ids("pambo")).not.toContain("melania-the-younger");
});

test("associated portraits inherit completion by exact saint ID, not their connection", () => {
  const completed = completedSaintIds([{ saint_id: "basil" }]);
  const associated = getAssociatedSaints("macrina-younger");
  expect(associated.filter(saint => completed.has(saint.id)).map(saint => saint.id)).toEqual(["basil"]);
  expect(completed.has("macrina-younger")).toBe(false);
});

test("unknown saints have no association links", () => {
  expect(getAssociatedSaints("missing-saint")).toEqual([]);
});