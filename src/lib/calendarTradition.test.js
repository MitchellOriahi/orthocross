import { describe, expect, test } from "bun:test";
import { calendarTraditionForOrientation, readCalendarTradition, saveCalendarTradition } from "./calendarTradition";

describe("calendar tradition defaults", () => {
  test("choosing Eastern defaults an Oriental calendar to Eastern", () => {
    expect(calendarTraditionForOrientation("eastern", "Oriental Orthodox")).toBe("Eastern Orthodox");
  });
  test("choosing Oriental defaults an Eastern calendar to Oriental", () => {
    expect(calendarTraditionForOrientation("oriental", "Eastern Orthodox")).toBe("Oriental Orthodox");
  });
  test("undecided preserves either manually selected calendar", () => {
    expect(calendarTraditionForOrientation("undecided", "Oriental Orthodox")).toBe("Oriental Orthodox");
    expect(calendarTraditionForOrientation("undecided", "Eastern Orthodox")).toBe("Eastern Orthodox");
  });
  test("a saved undecided choice survives reopening without affecting another account", () => {
    const previousStorage = globalThis.localStorage;
    const values = new Map();
    globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    try {
      saveCalendarTradition("reader", "Oriental Orthodox");
      expect(calendarTraditionForOrientation("undecided", readCalendarTradition("reader"))).toBe("Oriental Orthodox");
      expect(readCalendarTradition("other-reader")).toBe("Eastern Orthodox");
    } finally { globalThis.localStorage = previousStorage; }
  });
});