import { expect, test } from "bun:test";
import { translateString, waitForTranslationSettled } from "./domTranslator";

test("OrthoCross is never translated, including multiline text", () => {
  const dictionary = { OrthoCross: "ОртоКросс", Welcome: "Добро пожаловать" };
  expect(translateString("OrthoCross", dictionary)).toBe("OrthoCross");
  expect(translateString("Welcome\nOrthoCross", dictionary)).toBe("Добро пожаловать\nOrthoCross");
});

test("translated phrases retain the original app name", () => {
  expect(translateString("Welcome to OrthoCross", { "Welcome to OrthoCross": "Добро пожаловать в OrthoCross" })).toBe("Добро пожаловать в OrthoCross");
  expect(translateString("Welcome to OrthoCross", { "Welcome to OrthoCross": "Добро пожаловать в ОртоКросс" })).toBe("Welcome to OrthoCross");
});

test("language completion waits for text mutations to settle, not elapsed time", async () => {
  const keys = ["document", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const saved = keys.map(key => globalThis[key]);
  let tick;
  let mutate;
  let disconnected = false;
  try {
    globalThis.document = { body: {} };
    globalThis.MutationObserver = class {
      constructor(callback) { mutate = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    };
    globalThis.requestAnimationFrame = callback => { tick = callback; return 1; };
    globalThis.cancelAnimationFrame = () => {};
    let done = false;
    const pending = waitForTranslationSettled(new AbortController().signal).then(() => { done = true; });
    tick(); tick();
    await Promise.resolve();
    expect(done).toBe(false);
    mutate(); // Another translated update restarts the quiet-frame count.
    tick(); tick();
    await Promise.resolve();
    expect(done).toBe(false);
    tick();
    await pending;
    expect(done).toBe(true);
    expect(disconnected).toBe(true);
  } finally {
    keys.forEach((key, index) => {
      if (saved[index] === undefined) delete globalThis[key];
      else globalThis[key] = saved[index];
    });
  }
});