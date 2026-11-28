import { expect, test } from "bun:test";
import { appThemeConfig } from "./theme";

test("first launches and updates without a saved preference default to dark mode", () => {
  expect(appThemeConfig.defaultTheme).toBe("dark");
  expect(appThemeConfig.forcedTheme).toBeUndefined();
});