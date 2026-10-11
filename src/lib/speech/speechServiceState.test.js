import { test, expect } from "bun:test";
import { speechServiceError, pauseSpeechService } from "./speechServiceState";

test("402 persists a shared pause, preventing automatic retries after reload", () => {
  const storage = new Map();
  const original = globalThis.localStorage;
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  try {
    expect(pauseSpeechService(500, {})).toBeNull();
    const message = pauseSpeechService(402, { details: JSON.stringify({ message: "Not enough credits" }) });
    expect(speechServiceError()).toBe(message);
    expect(storage.get("readAloudServicePaused")).toBe(message);
  } finally { globalThis.localStorage = original; }
});