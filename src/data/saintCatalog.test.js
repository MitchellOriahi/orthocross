import { describe, expect, test } from "bun:test";
import { mergeSaintCatalog } from "./saintCatalog";
import { additionalSaints } from "./additionalSaints";

const entry = (id, name, epithet = "") => ({
  id, name, epithet, prefix: "St.", shortDescription: "Apostle",
  tradition: "Eastern/Oriental", iconUrl: "icon.jpg", content: ["Life"],
});

describe("Saints catalog", () => {
  test("adds exactly 88 distinct saints without duplicating the existing twelve", () => {
    const originalIds = ["anthony", "athanasius", "basil", "catherine", "george", "john-chrysostom", "mark", "mary-egypt", "moses-black", "nicholas", "paisios-athonite", "theotokos"];
    expect(additionalSaints).toHaveLength(88);
    expect(new Set(additionalSaints.map(s => s.id)).size).toBe(88);
    for (const saint of additionalSaints) {
      expect(originalIds).not.toContain(saint.id);
      expect(saint.content.length).toBeGreaterThanOrEqual(3);
      expect(saint.iconCredit.source.startsWith("https://commons.wikimedia.org/wiki/File:")).toBe(true);
      expect(saint.iconUrl.startsWith("/__l5e/assets-v1/")).toBe(true);
    }
  });

  test("includes all twelve apostles, John the Baptist, and John of Damascus", () => {
    const ids = additionalSaints.map(s => s.id);
    for (const id of ["peter-apostle", "andrew-first-called", "james-son-of-zebedee", "john-theologian", "philip-apostle", "bartholomew-apostle", "thomas-apostle", "matthew-evangelist", "james-son-of-alphaeus", "jude-thaddeus", "simon-zealot", "matthias-apostle", "john-the-baptist", "saint-john-damascus"]) {
      expect(ids).toContain(id);
    }
  });

  test("keeps Theotokos in alphabetical order rather than pinning her first", () => {
    const original = [entry("theotokos", "Theotokos"), entry("anthony", "Anthony")];
    const added = [entry("john-damascus", "John", "of Damascus"), entry("titus", "Titus")];
    expect(mergeSaintCatalog(original, added).map(saint => saint.id)).toEqual([
      "anthony", "john-damascus", "theotokos", "titus",
    ]);
    expect(original.map(saint => saint.id)).toEqual(["theotokos", "anthony"]);
  });
});