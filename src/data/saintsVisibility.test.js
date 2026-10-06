import { expect, test } from "bun:test";
import { getVisibleSaints } from "./saintsVisibility";

test("temporarily hides all saints without changing their saved information", () => {
  const saved = [{ id: "athanasius", content: ["Saved story"], iconUrl: "saved-icon.jpg" }];
  const before = structuredClone(saved);
  expect(getVisibleSaints(saved)).toEqual([]);
  expect(saved).toEqual(before);
});

test("restoring visibility returns the exact saved saints and order", () => {
  const saved = [{ id: "anthony" }, { id: "athanasius" }, { id: "theotokos" }];
  expect(getVisibleSaints(saved, true)).toBe(saved);
  expect(getVisibleSaints(saved, true).map(saint => saint.id)).toEqual(["anthony", "athanasius", "theotokos"]);
});