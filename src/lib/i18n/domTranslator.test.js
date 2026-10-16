import { expect, test } from "bun:test";
import { translateString } from "./domTranslator";

test("OrthoCross is never translated, including multiline text", () => {
  const dictionary = { OrthoCross: "ОртоКросс", Welcome: "Добро пожаловать" };
  expect(translateString("OrthoCross", dictionary)).toBe("OrthoCross");
  expect(translateString("Welcome\nOrthoCross", dictionary)).toBe("Добро пожаловать\nOrthoCross");
});

test("translated phrases retain the original app name", () => {
  expect(translateString("Welcome to OrthoCross", { "Welcome to OrthoCross": "Добро пожаловать в OrthoCross" })).toBe("Добро пожаловать в OrthoCross");
  expect(translateString("Welcome to OrthoCross", { "Welcome to OrthoCross": "Добро пожаловать в ОртоКросс" })).toBe("Welcome to OrthoCross");
});