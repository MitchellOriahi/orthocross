import { test, expect } from "bun:test";
import { buildChunks } from "./speechEngine";
import { tokenize } from "../../components/reading/SpeakableText";

test("tokenize keeps spacing and punctuation exactly", () => {
  const text = "In the beginning,  God created.";
  const { tokens, words } = tokenize(text, 0);
  expect(tokens.map((t) => t.t).join("")).toBe(text);
  expect(words).toEqual(["In", "the", "beginning,", "God", "created."]);
});

test("chunks start from the tapped word and keep global indices", () => {
  const words = "Jesus wept. And the Jews said, Behold how he loved him!".split(" ");
  const chunks = buildChunks(words, 3);
  expect(chunks[0].wordIdx[0]).toBe(3);
  expect(chunks.flatMap((c) => c.wordIdx)).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
});
