import { expect, test } from "bun:test";
import { getSaintPageList, getSaintPageSubgroups, saintPageRoster, saintSortName } from "./saintPageRoster";
import { saintsContent } from "./saintsContent";

test("All includes both traditions in the selected category", () => {
  const names = getSaintPageList("angels", "Archangels", "", "all").map(s => s.name);
  expect(names).toContain("Michael");
  expect(names).toContain("Raguel");
});
test("Eastern includes shared saints but excludes Oriental-only saints", () => {
  const names = getSaintPageList("angels", "Archangels", "", "Eastern").map(s => s.name);
  expect(names).toContain("Michael");
  expect(names).not.toContain("Raguel");
});
test("Oriental includes shared saints and respects search and subgroup selection", () => {
  expect(getSaintPageList("angels", "Archangels", "Michael", "Oriental").map(s => s.name)).toEqual(["Michael"]);
  expect(getSaintPageList("angels", "Archangels", "Raguel", "Oriental").map(s => s.name)).toEqual(["Raguel"]);
  expect(getSaintPageList("angels", "Guardians", "Michael", "Oriental")).toEqual([]);
  expect(getSaintPageList("fathers-hierarchs", "Apostolic", "Irenaeus", "Oriental")).toEqual([]);
});

test("the supplied roster shows all twelve archangels and hides empty Appearances", () => {
  expect(getSaintPageList("angels", "Archangels")).toHaveLength(12);
  expect(getSaintPageList("angels")).toHaveLength(24);
  expect(getSaintPageSubgroups("angels")).toEqual(["Archangels", "Heavenly Orders", "Guardians", "Witnesses"]);
  expect(getSaintPageList("angels", "Appearances")).toEqual([]);
});
test("shared saints are one record across categories and subgroups", () => {
  const emperor = getSaintPageList("laypeople", "Emperors").find(s => s.name === "Constantine the Great");
  const missionary = getSaintPageList("apostles-missionaries", "Equal-to-Apostles").find(s => s.name === "Constantine the Great");
  expect(emperor).toBe(missionary);
  expect(new Set(saintPageRoster.map(s => s.id)).size).toBe(saintPageRoster.length);
  expect(getSaintPageList("martyrs").filter(s => s.name === "Ignatius of Antioch")).toHaveLength(1);
});
test("biblical names do not merge with similarly named monastics and fathers", () => {
  expect(getSaintPageList("biblical", "Forefathers", "Isaac")[0].name).toBe("Isaac");
  expect(getSaintPageList("fathers-hierarchs", "Syriac", "Isaac")[0].name).toBe("Isaac of Nineveh");
  expect(getSaintPageList("fathers-hierarchs", "Syriac", "Isaac")[0].prefix).toBe("St.");
  expect(getSaintPageList("angels", "Heavenly Orders", "Seraphim")[0].name).toBe("Seraphim");
  expect(getSaintPageList("monastics", "Elders", "Seraphim")[0].name).toBe("Seraphim of Sarov");
});
test("search stays within the selected subgroup", () => {
  expect(getSaintPageList("angels", "Archangels", "Michael").map(s => s.name)).toEqual(["Michael"]);
  expect(getSaintPageList("angels", "Guardians", "Michael")).toEqual([]);
  expect(getSaintPageList("laypeople", "Modern", "Matrona").map(s => s.name)).toEqual(["Matrona of Moscow"]);
});
test("search matches names only, not subtitles", () => {
  const names = getSaintPageList(null, null, "John").map(s => s.name);
  expect(names).toContain("John Chrysostom");
  expect(names).not.toContain("Anthusa");
  expect(names).not.toContain("Elizabeth");
  expect(names.every(name => name.toLowerCase().includes("john"))).toBe(true);
  const josephs = getSaintPageList(null, null, "Joseph").map(s => s.name);
  expect(josephs.length).toBeGreaterThan(0);
  expect(josephs.every(name => name.toLowerCase().includes("joseph"))).toBe(true);
});
test("lists sort alphabetically ignoring honorifics", () => {
  for (const prefix of ["St.", "Prophet", "Righteous", "Archangel", "Abba", "Amma", "The"]) expect(saintSortName(`${prefix} Adam`)).toBe("Adam");
  const list = getSaintPageList("biblical");
  expect(list[0].name).toBe("Abel");
  expect(list.map(s => saintSortName(s.name))).toEqual(list.map(s => saintSortName(s.name)).sort((a,b) => a.localeCompare(b,"en")));
});
test("the roster keeps supplied traditions and saved biographies intact", () => {
  expect(getSaintPageList("angels", "Archangels", "Raguel")[0].tradition).toBe("Oriental");
  expect(getSaintPageList("fathers-hierarchs", "Apostolic", "Irenaeus")[0].tradition).toBe("Eastern");
  const original = saintsContent.find(s => s.id === "anthony");
  const shown = getSaintPageList("monastics", "Desert Fathers", "Anthony")[0];
  expect(original.content).toHaveLength(8); // preserved biography untouched
  expect(shown.content.length).toBeGreaterThanOrEqual(8);
  expect(shown.iconUrl).toBe(original.iconUrl);
  expect(saintsContent).toHaveLength(100);
});
test("every roster saint's story has at most 12 cards", () => {
  for (const saint of saintPageRoster) expect(saint.content.length).toBeLessThanOrEqual(12);
});
