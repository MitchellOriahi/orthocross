export const COLLECTIONS = ["saint-icons", "archangel-icons", "virgin-mary-icons", "christ-icons", "holy-presentations-icons"] as const;

export class CatalogUnavailable extends Error {}

export async function fetchCatalog(collection: string, request: typeof fetch = fetch, wait: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  if (!COLLECTIONS.some(value => value === collection)) throw new Error("Unknown collection");
  const products: Record<string, unknown>[] = [];
  for (let page = 1; page <= 100; page++) {
    if (page > 1) await wait(550);
    const url = `https://www.athoniteusa.com/collections/${collection}/products.json?limit=250&page=${page}`;
    const response = await request(url, { headers: { "User-Agent": "OrthoCross icon import", Accept: "application/json" }, redirect: "error" });
    if (!response.ok) throw new CatalogUnavailable(`${collection}: catalog unavailable (HTTP ${response.status}). Import stopped; request files from Athonite. No HTML scraping or bypass attempted.`);
    let body: { products?: unknown };
    try { body = await response.json(); } catch { throw new CatalogUnavailable(`${collection}: catalog did not return JSON. Import stopped; request files from Athonite.`); }
    if (!Array.isArray(body.products)) throw new CatalogUnavailable(`${collection}: missing product list. Import stopped; request files from Athonite.`);
    if (body.products.length === 0) return products;
    products.push(...body.products);
  }
  throw new CatalogUnavailable(`${collection}: pagination did not finish. Import stopped.`);
}