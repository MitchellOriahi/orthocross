import { expect, test } from "bun:test";
import { SAINT_CARD_ICONS } from "./saintCardIcons";
import roster from "./saintPageRoster.json";
import { saintPageRoster } from "./saintPageRoster";
import { saintsContent } from "./saintsContent";

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
    expect(portrait.focus_x).toBeGreaterThanOrEqual(0);
    expect(portrait.focus_x).toBeLessThanOrEqual(100);
    expect(portrait.focus_y).toBeGreaterThanOrEqual(0);
    expect(portrait.focus_y).toBeLessThanOrEqual(100);
    expect(portrait.zoom).toBeGreaterThanOrEqual(1);
    expect(portrait.zoom).toBeLessThanOrEqual(8);
  }
});

test("new portraits retain the same source and license in the story view", () => {
  for (const [id, portrait] of Object.entries(SAINT_CARD_ICONS)) {
    const saint = saintPageRoster.find(s => s.id === id);
    expect(saint.iconUrl).toBe(portrait.image_url);
    expect(saint.iconCredit.source).toBe(portrait.image_source);
    expect(saint.iconCredit.license).toBe(portrait.image_license);
  }
});

test("alternate roster spellings reuse the correct existing portraits and credits", () => {
  for (const [id, originalId] of Object.entries({
    "jude-thaddaeus": "jude-thaddeus", paul: "paul-apostle", philip: "philip-apostle",
    cyril: "cyril-slavs", "mark-the-evangelist": "mark",
  })) {
    const saint = saintPageRoster.find(s => s.id === id);
    const original = saintsContent.find(s => s.id === originalId);
    expect(saint.iconUrl).toBe(original.iconUrl);
    expect(saint.iconCredit).toEqual(original.iconCredit);
  }
});

test("newly sourced individual and collective saints have stored portraits", () => {
  for (const id of [
    "elizabeth", "silas", "aquila", "sarah-of-the-desert", "gorgonia",
    "gregory-of-narek", "luke-the-stylite", "andrew-the-fool-for-christ",
    "peter-of-alexandria", "clement-of-ancyra", "samuel-the-confessor",
    "theophano", "peter-and-fevronia-of-murom", "armenian-genocide-martyrs",
    "the-21-martyrs-of-libya", "barachiel", "jeremiel", "dominions",
    "powers", "principalities", "four-living-creatures", "twenty-four-elders",
  ]) {
    const saint = saintPageRoster.find(entry => entry.id === id);
    expect(saint?.iconUrl).toStartWith("/__l5e/assets-v1/");
    expect(saint?.iconCredit?.source).toStartWith("https://");
  }
});