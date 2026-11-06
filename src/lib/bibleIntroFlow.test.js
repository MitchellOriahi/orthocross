import { test, expect } from "bun:test";
import {
  idleBibleIntroState,
  introInfoClick,
  dismissIntroTutorial,
  introTutorialBlocksSectionDismiss,
} from "./bibleIntroFlow";

test("tapping the glowing i opens Mark Chapters as Read and explains it on top", () => {
  expect(introInfoClick()).toEqual({ infoPulse: false, chapterMarking: true, tutorial: true });
});

test("the glowing i stops pulsing after the first tap", () => {
  expect(introInfoClick().infoPulse).toBe(false);
});

test("dismissing the explanation leaves the section open", () => {
  expect(dismissIntroTutorial()).toEqual({ infoPulse: false, chapterMarking: true, tutorial: false });
});

test("the section stays open behind the explanation instead of closing with it", () => {
  const afterTap = introInfoClick();
  const afterDismiss = dismissIntroTutorial();
  expect(afterTap.chapterMarking).toBe(true);
  expect(afterDismiss.chapterMarking).toBe(true);
  expect(afterDismiss.tutorial).toBe(false);
});

test("the explanation blocks the section behind it from being dismissed", () => {
  expect(introTutorialBlocksSectionDismiss(true)).toBe(true);
  expect(introTutorialBlocksSectionDismiss(false)).toBe(false);
});

test("a fresh session starts with nothing open", () => {
  expect(idleBibleIntroState()).toEqual({ infoPulse: false, chapterMarking: false, tutorial: false });
});
