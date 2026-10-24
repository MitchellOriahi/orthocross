import { expect, test } from "bun:test";
import { submitOrientationChoice } from "./orientationSubmission";

test("a church selection saves the branch and completion before proceeding", async () => {
  const events = [];
  await submitOrientationChoice({
    saveBranch: async () => { events.push("Greek Orthodox"); return { error: null }; },
    saveCompletion: async () => { events.push("completed"); return { error: null }; },
    onComplete: () => events.push("proceed"),
    setSaving: value => events.push(value),
  });
  expect(events).toEqual([true, "Greek Orthodox", "completed", "proceed", false]);
});

test("a rejected save releases the controls and does not falsely complete the survey", async () => {
  const events = [];
  await expect(submitOrientationChoice({
    saveBranch: async () => { throw new Error("connection failed"); },
    saveCompletion: async () => { events.push("completed"); return { error: null }; },
    onComplete: () => events.push("proceed"),
    setSaving: value => events.push(value),
  })).rejects.toThrow("connection failed");
  expect(events).toEqual([true, false]);
});

test("completion write errors release the controls without losing the retry path", async () => {
  const events = [];
  await expect(submitOrientationChoice({
    saveCompletion: async () => ({ error: new Error("completion failed") }),
    onComplete: () => events.push("proceed"),
    setSaving: value => events.push(value),
  })).rejects.toThrow("completion failed");
  expect(events).toEqual([true, false]);
});