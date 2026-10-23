import { describe, expect, test } from "bun:test";
import { iconStyleForBranch, orientationFilter, orientationForBranch, orientationChurchOptions, shouldShowOrientationOnboarding, initialOrientationOnboardingStep, ORIENTATION_SIGNUP_METADATA } from "./orthodoxOrientation";

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
  test("a new account chooses language first even when this device has a language", () => {
    const previousStorage = globalThis.localStorage;
    globalThis.localStorage = { getItem: key => key === "orthocross-language" ? "es" : null };
    try {
      expect(initialOrientationOnboardingStep(ORIENTATION_SIGNUP_METADATA, false)).toBe("language");
    } finally {
      globalThis.localStorage = previousStorage;
    }
  });
  test("an unseen legacy account also starts with language", () => {
    expect(initialOrientationOnboardingStep({}, false)).toBe("language");
  });
  test("completed accounts do not restart language onboarding", () => {
    expect(initialOrientationOnboardingStep({ orientation_onboarding_status: "completed" }, false)).toBeNull();
    expect(initialOrientationOnboardingStep(ORIENTATION_SIGNUP_METADATA, true)).toBeNull();
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
  test("any other church falls back to Greek icons", () => {
    expect(iconStyleForBranch("Armenian Apostolic")).toBe("original");
    expect(iconStyleForBranch("Serbian Orthodox")).toBe("original");
  });
  test("a cleared branch leaves icons untouched", () => {
    expect(iconStyleForBranch(null)).toBeNull();
    expect(iconStyleForBranch(undefined)).toBeNull();
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
    globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } };
    return store;
  }
  test("a manual icon choice survives later branch changes", async () => {
    stubStorage();
    const { setCategoryIconStyle, hasManualCategoryIconStyle, getCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    setCategoryIconStyle("prayers", "coptic", { manual: true });
    expect(hasManualCategoryIconStyle("prayers")).toBe(true);
    applyBranchPreferences("Russian Orthodox");
    expect(getCategoryIconStyle("prayers")).toBe("coptic");
  });
  test("branch defaults still apply when the user never picked a style", async () => {
    stubStorage();
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    const { getCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    applyBranchPreferences("Russian Orthodox");
    expect(getCategoryIconStyle("saints")).toBe("byzantine");
    expect(getCategoryIconStyle("prayers")).toBe("byzantine");
  });
  test("an explicit church choice overrides an earlier manual icon pick", async () => {
    stubStorage();
    const { setCategoryIconStyle, getCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    setCategoryIconStyle("prayers", "coptic", { manual: true });
    applyBranchPreferences("Ethiopian Tewahedo", { force: true });
    expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
    expect(getCategoryIconStyle("saints")).toBe("tewahedo");
  });
  test("an explicit choice of any other church gives Greek icons", async () => {
    stubStorage();
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    const { getCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    applyBranchPreferences("Armenian Apostolic", { force: true });
    expect(getCategoryIconStyle("saints")).toBe("original");
    expect(getCategoryIconStyle("prayers")).toBe("original");
  });
  test("a manual pick in Prayers leaves Saints on its own style", async () => {
    stubStorage();
    const { setCategoryIconStyle, getCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    applyBranchPreferences("Coptic");
    setCategoryIconStyle("prayers", "tewahedo", { manual: true });
    applyBranchPreferences("Russian Orthodox");
    expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
    expect(getCategoryIconStyle("saints")).toBe("byzantine");
  });
  test("a manual pick in Saints leaves Prayers on its own style", async () => {
    stubStorage();
    const { setCategoryIconStyle, getCategoryIconStyle } = await import("../hooks/useCategoryIconStyle");
    const { applyBranchPreferences } = await import("./orthodoxOrientation");
    applyBranchPreferences("Coptic");
    setCategoryIconStyle("saints", "byzantine", { manual: true });
    applyBranchPreferences("Ethiopian Tewahedo");
    expect(getCategoryIconStyle("saints")).toBe("byzantine");
    expect(getCategoryIconStyle("prayers")).toBe("tewahedo");
  });
});
