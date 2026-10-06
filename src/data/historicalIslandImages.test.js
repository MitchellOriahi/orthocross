import { describe, expect, test } from "bun:test";
import { historyContent, HISTORY_ICONS } from "./historyContent";
import { HISTORICAL_ISLAND_IMAGES } from "./historicalIslandImages";

describe("authentic historical island imagery", () => {
  const islands = historyContent.campaigns.flatMap(campaign => campaign.islands);
  test("all 19 islands use registered reusable historical sources", () => {
    expect(islands).toHaveLength(19);
    for (const island of islands) {
      const image = HISTORICAL_ISLAND_IMAGES[island.id];
      expect(image).toBeDefined();
      expect(island.iconUrl).toBe(image.url);
      expect(image.url).toStartWith("/__l5e/assets-v1/");
      expect(image.source).toStartWith("https://commons.wikimedia.org/wiki/File:");
      expect(["Public domain", "CC0", "CC BY 4.0", "CC BY-SA 2.0", "CC BY-SA 2.5", "CC BY-SA 3.0", "CC BY-SA 4.0"]).toContain(image.license);
    }
    expect(HISTORY_ICONS).toHaveLength(19);
    expect(new Set(HISTORY_ICONS).size).toBe(19);
  });
});