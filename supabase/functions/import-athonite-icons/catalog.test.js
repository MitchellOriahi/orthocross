import { describe, expect, test } from "bun:test";
import { fetchCatalog } from "./catalog.ts";

describe("Athonite import safeguards", () => {
  test("uses the specified JSON feed, limit 250 and polite user agent; pages until empty", async () => {
    const calls = [];
    const waits = [];
    const products = await fetchCatalog("saint-icons", async (url, options) => {
      calls.push({ url, options });
      return Response.json({ products: calls.length === 1 ? [{ id: 123 }] : [] });
    }, async ms => { waits.push(ms); });
    expect(products).toEqual([{ id: 123 }]);
    expect(calls.map(c => c.url)).toEqual([
      "https://www.athoniteusa.com/collections/saint-icons/products.json?limit=250&page=1",
      "https://www.athoniteusa.com/collections/saint-icons/products.json?limit=250&page=2",
    ]);
    expect(calls[0].options.headers["User-Agent"]).toBe("OrthoCross icon import");
    expect(waits).toEqual([550]);
  });
  test("stops immediately on blocked JSON without retry or HTML scraping", async () => {
    let calls = 0;
    await expect(fetchCatalog("saint-icons", async () => { calls++; return new Response("blocked", { status: 403 }); })).rejects.toThrow("HTTP 403");
    expect(calls).toBe(1);
  });
  test("stops when JSON is unavailable", async () => {
    await expect(fetchCatalog("saint-icons", async () => new Response("<html>"))).rejects.toThrow("did not return JSON");
  });
  test("rejects arbitrary collection names without requests", async () => {
    let calls = 0;
    await expect(fetchCatalog("other", async () => { calls++; return Response.json({ products: [] }); })).rejects.toThrow("Unknown collection");
    expect(calls).toBe(0);
  });
});