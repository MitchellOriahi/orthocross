import { test, expect } from "bun:test";
import { shouldPulseArchangel, completesDonorTierIntro } from "./donorTierIntro";

test("Archangel pulses on first-ever use", () => expect(shouldPulseArchangel(null)).toBe(true));
test("Archangel stops pulsing after its saved interaction", () => expect(shouldPulseArchangel("1")).toBe(false));
test("clicking Archangel completes the introduction", () => expect(completesDonorTierIntro("archangel")).toBe(true));
test("clicking another tier does not dismiss the Archangel introduction", () => expect(completesDonorTierIntro("angel")).toBe(false));