import { describe, expect, test } from "bun:test";
import { iconStyleForBranch, orientationFilter, orientationForBranch } from "./orthodoxOrientation";

describe("orthodox orientation rules", () => {
  test("Coptic sets Coptic icons", () => expect(iconStyleForBranch("Coptic")).toBe("coptic"));
  test("Tewahedo branches set Tewahedo icons", () => {
    expect(iconStyleForBranch("Ethiopian Tewahedo")).toBe("tewahedo");
    expect(iconStyleForBranch("Eritrean Tewahedo")).toBe("tewahedo");
  });
  test("Russian sets Russian icons", () => expect(iconStyleForBranch("Russian Orthodox")).toBe("byzantine"));
  test("Greek sets Greek icons", () => expect(iconStyleForBranch("Greek Orthodox")).toBe("original"));
  test("other churches leave icons as they are", () => {
    expect(iconStyleForBranch("Armenian Apostolic")).toBeNull();
    expect(iconStyleForBranch("Serbian Orthodox")).toBeNull();
  });
  test("branch family sets orientation", () => {
    expect(orientationForBranch("Syriac Orthodox")).toBe("oriental");
    expect(orientationForBranch("Antiochian Orthodox")).toBe("eastern");
    expect(orientationForBranch("Inquirer")).toBe("undecided");
  });
  test("undecided shows everything", () => expect(orientationFilter("undecided")).toBe("all"));
  test("oriental filters to Oriental", () => expect(orientationFilter("oriental")).toBe("Oriental"));
});
