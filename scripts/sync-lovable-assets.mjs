// Copies every Lovable-hosted image (src/**/*.asset.json) into public/ at the
// same path the app requests (/__l5e/assets-v1/...), so the website, the iOS
// and Android apps, and local dev all serve them without Lovable's hosting.
// Only downloads files that aren't already present.  npm run sync:lovable-assets
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const ORIGIN = process.env.LOVABLE_ASSET_ORIGIN ?? "https://orthocross.lovable.app";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);

// The daily verse photo library lists its Lovable-hosted photos by URL.
const dailyLibrary = JSON.parse(readFileSync(join(root, "src/assets/verse-backgrounds/dailyLibrary.json"), "utf8"));
const libraryPhotos = Object.values(dailyLibrary).flat().map((p) => ({ url: p.url, original_filename: basename(p.url) }));

const assets = [...walk(join(root, "src"))
  .filter((f) => f.endsWith(".asset.json"))
  .map((f) => JSON.parse(readFileSync(f, "utf8"))), ...libraryPhotos]
  .filter((a, i, all) => all.findIndex((b) => b.url === a.url) === i)
  .filter((a) => a.url?.startsWith("/__l5e/") && !existsSync(join(root, "public", a.url)));

console.log(`${assets.length} image(s) to download from ${ORIGIN}`);
let failed = 0;
for (const [i, a] of assets.entries()) {
  const res = await fetch(ORIGIN + a.url);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    failed++;
    console.log(`  ✗ ${a.original_filename}: HTTP ${res.status} ${type}`);
    continue;
  }
  const dest = join(root, "public", a.url);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${assets.length}`);
}
// Donor-tier icons are also used by the thank-you email (_shared/donorStats.ts),
// which links to stable paths: /email/tier-<name>.jpg
for (const f of walk(join(root, "src/assets/tiers")).filter((f) => f.endsWith(".jpg.asset.json"))) {
  const { url } = JSON.parse(readFileSync(f, "utf8"));
  const src = join(root, "public", url);
  if (existsSync(src)) {
    mkdirSync(join(root, "public/email"), { recursive: true });
    writeFileSync(join(root, "public/email", `tier-${basename(f, ".jpg.asset.json")}.jpg`), readFileSync(src));
  }
}
console.log(failed ? `${failed} failed` : "done");
process.exit(failed ? 1 : 0);
