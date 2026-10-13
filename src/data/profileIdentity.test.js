import { describe, expect, test } from "bun:test";
import { getBranchTradition, ORTHODOX_BRANCHES, PATRON_SAINT_OPTIONS } from "./profileIdentity";

describe("Profile identity branches", () => {
  test("Coptic belongs to the orange Oriental branch family", () => {
    expect(getBranchTradition("Coptic")).toBe("oriental");
  });
  test("both Tewahedo branches belong to the Oriental family", () => {
    expect(getBranchTradition("Ethiopian Tewahedo")).toBe("oriental");
    expect(getBranchTradition("Eritrean Tewahedo")).toBe("oriental");
  });
  test("Eastern branches belong to the blue family", () => {
    expect(getBranchTradition("Greek Orthodox")).toBe("eastern");
    expect(getBranchTradition("Russian Orthodox")).toBe("eastern");
  });
  test("Inquirer and unaffiliated choices belong to the grey family", () => {
    expect(getBranchTradition("Inquirer")).toBe("unaffiliated");
    expect(getBranchTradition("Exploring Orthodoxy")).toBe("unaffiliated");
    expect(getBranchTradition(null)).toBe("unaffiliated");
  });
  test("patron saints retain their exact unique roster identities", () => {
    expect(PATRON_SAINT_OPTIONS.find(saint => saint.value === "michael")?.label).toBe("Archangel Michael");
    expect(new Set(PATRON_SAINT_OPTIONS.map(saint => saint.value)).size).toBe(PATRON_SAINT_OPTIONS.length);
    expect(new Set(ORTHODOX_BRANCHES.map(branch => branch.value)).size).toBe(ORTHODOX_BRANCHES.length);
  });
});