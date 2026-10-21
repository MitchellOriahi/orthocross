import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { TRANSLATIONS } from "./translations";

test("Eastern and Oriental tradition choices never share a label", () => {
  for (const [language, words] of Object.entries(TRANSLATIONS)) {
    if (words.eastern || words.oriental) expect(words.eastern, language).not.toBe(words.oriental);
  }
  for (const file of readdirSync("public/i18n")) {
    const words = JSON.parse(readFileSync(`public/i18n/${file}`, "utf8"));
    expect(words.Eastern, file).not.toBe(words.Oriental);
    expect(words["Eastern Orthodox"], file).not.toBe(words["Oriental Orthodox"]);
  }
});

