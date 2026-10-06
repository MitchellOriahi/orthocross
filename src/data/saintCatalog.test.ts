import { describe, expect, test } from "bun:test";
import { mergeSaintCatalog } from "./saintCatalog";
import type { SaintDetail } from "./saintTypes";

const entry = (id: string, name: string, epithet = ""): SaintDetail => ({
  id, name, epithet, prefix: "St.", shortDescription: "Apostle",
  tradition: "Eastern/Oriental", iconUrl: "icon.jpg", content: ["Life"],
});

describe("Saints catalog", () => {
  test("keeps Theotokos in alphabetical order rather than pinning her first", () => {
    const original = [entry("theotokos", "Theotokos"), entry("anthony", "Anthony")];
    const added = [entry("john-damascus", "John", "of Damascus"), entry("titus", "Titus")];
    expect(mergeSaintCatalog(original, added).map(saint => saint.id)).toEqual([
      "anthony", "john-damascus", "theotokos", "titus",
    ]);
    expect(original.map(saint => saint.id)).toEqual(["theotokos", "anthony"]);
  });
});