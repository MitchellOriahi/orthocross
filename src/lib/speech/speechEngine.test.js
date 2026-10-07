import { test, expect } from "bun:test";
import { buildTimings, wordAt } from "./audioTiming";
import { tokenize } from "../../components/reading/SpeakableText";
import { chapterAudioPath } from "../../config/bibleAudio";

test("tokenize keeps spacing exactly and skips footnote markers", () => {
  const text = "In the beginning, [a] God created.";
  const { tokens, words } = tokenize(text, 0);
  expect(tokens.map((t) => t.t).join("")).toBe(text);
  expect(words).toEqual(["In", "the", "beginning,", "God", "created."]);
});

test("audio paths follow translation/voice/book-slug/chapter", () => {
  expect(chapterAudioPath("KJV", "female", "John", 3, "mp3")).toBe("kjv/female/john/3.mp3");
  expect(chapterAudioPath("kjv", "male", "1 Samuel", 2, "json")).toBe("kjv/male/1-samuel/2.json");
});

test("matching timing file is used as-is", () => {
  const { timings, matched } = buildTimings(["There", "was"], { words: [{ i: 0, s: 0.2, e: 0.46 }, { i: 1, s: 0.46, e: 0.62 }] }, 1);
  expect(matched).toBe(true);
  expect(timings[1].s).toBe(0.46);
});

test("mismatched counts spread words by length across duration", () => {
  const { timings, matched } = buildTimings(["ab", "abcd"], { words: [] }, 6);
  expect(matched).toBe(false);
  expect(timings[1].s).toBeCloseTo(2);
  expect(wordAt(timings, 3)).toBe(1);
  expect(wordAt(timings, 0.5)).toBe(0);
});
