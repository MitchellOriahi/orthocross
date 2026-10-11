import { test, expect } from "bun:test";
import { speechServiceError, pauseSpeechService, clearSpeechServicePause } from "./speechServiceState";

const withStorage = (fn) => {
  const storage = new Map();
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  try { fn(storage); } finally { globalThis.localStorage = original; clearSpeechServicePause(); }
};

test("402 pauses new requests with a shared message", () => {
  withStorage((storage) => {
    expect(pauseSpeechService(500, {})).toBeNull();
    const message = pauseSpeechService(402, { details: JSON.stringify({ message: "Not enough credits" }) });
    expect(speechServiceError()).toBe(message);
    expect(JSON.parse(storage.get("readAloudServicePaused")).message).toBe(message);
  });
});

test("the pause expires after the cooldown so the service is retried", () => {
  withStorage((storage) => {
    pauseSpeechService(402, {});
    const stored = JSON.parse(storage.get("readAloudServicePaused"));
    storage.set("readAloudServicePaused", JSON.stringify({ ...stored, at: Date.now() - 31 * 60 * 1000 }));
    expect(speechServiceError()).toBeNull();
    expect(storage.get("readAloudServicePaused")).toBeUndefined();
  });
});

test("a successful request lifts the pause immediately", () => {
  withStorage((storage) => {
    pauseSpeechService(403, {});
    expect(speechServiceError()).not.toBeNull();
    clearSpeechServicePause();
    expect(speechServiceError()).toBeNull();
    expect(storage.get("readAloudServicePaused")).toBeUndefined();
  });
});
