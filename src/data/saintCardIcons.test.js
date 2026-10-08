import { expect, test } from "bun:test";
import { SAINT_CARD_ICONS } from "./saintCardIcons";
import roster from "./saintPageRoster.json";

test("saint portraits are attached only to identities in the visible roster", () => {
  const identities = new Set(roster.map(saint => saint.id));
  for (const id of Object.keys(SAINT_CARD_ICONS)) {
    expect(identities.has(id)).toBe(true);
  }
});

test("every bundled saint portrait retains its online source and reusable license", () => {
  for (const portrait of Object.values(SAINT_CARD_ICONS)) {
    expect(new URL(portrait.image_source).protocol).toBe("https:");
    expect(portrait.image_license).toMatch(/^(Public domain|CC0|CC BY)/);
    expect(portrait.image_attribution.trim().length).toBeGreaterThan(0);
    expect(portrait.image_url).toStartWith("/__l5e/assets-v1/");
  }
});