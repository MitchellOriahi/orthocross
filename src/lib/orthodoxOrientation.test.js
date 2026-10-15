import { describe, expect, test } from "bun:test";
import { iconStyleForBranch, orientationFilter, orientationForBranch, orientationChurchOptions, shouldShowOrientationOnboarding, ORIENTATION_SIGNUP_METADATA } from "./orthodoxOrientation";

describe("orthodox orientation rules", () => {
  test("church lists are alphabetical", () => {
    for (const tradition of ["eastern", "oriental"]) {
      const labels = orientationChurchOptions(tradition).map(b => b.label);
      expect(labels.length).toBeGreaterThan(0);
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "en")));
    }
  });
  test("church lists exclude the two generic Orthodox families", () => {
    expect(orientationChurchOptions("eastern").map(b => b.value)).not.toContain("Eastern Orthodox");
    expect(orientationChurchOptions("oriental").map(b => b.value)).not.toContain("Oriental Orthodox");
  });
  test("new accounts are eligible for the sticker", () => {
    expect(shouldShowOrientationOnboarding(ORIENTATION_SIGNUP_METADATA, false)).toBe(true);
  });
  test("existing accounts that have never seen the sticker are eligible on next use", () => {
    expect(shouldShowOrientationOnboarding({}, false)).toBe(true);
    expect(shouldShowOrientationOnboarding(undefined, false)).toBe(true);
  });
  test("previously completed existing accounts remain ineligible", () => {
    expect(shouldShowOrientationOnboarding({}, true)).toBe(false);
  });
  test("completed accounts never see the sticker even on another device", () => {
    expect(shouldShowOrientationOnboarding({ orientation_onboarding_status: "completed" }, false)).toBe(false);
    expect(shouldShowOrientationOnboarding(ORIENTATION_SIGNUP_METADATA, true)).toBe(false);
  });
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

describe("manual icon style choices", () => {
  function stubStorage() {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    return store;
  }
  test("a manual icon choice survives later branch changes", async () => {
    stubStorage();
    const { setCategoryIconStyle, hasManualCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    const { parseCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    setCategoryIconStyle("coptic", { manual: true });
    expect(hasManualCategoryIconStyle()).toBe(true);
    applyBranchPreferences("Russian Orthodox");
    expect(parseCategoryIconStyle(localStorage.getItem("category-icon-style"))).toBe("coptic");
  });
  test("branch defaults still apply when the user never picked a style", async () => {
    stubStorage();
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    const { parseCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    applyBranchPreferences("Russian Orthodox");
    expect(parseCategoryIconStyle(localStorage.getItem("category-icon-style"))).toBe("byzantine");
  });
});
