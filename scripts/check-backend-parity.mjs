// Run after every `git pull` of Lovable's changes:  npm run check:parity
//
// Lovable edits against its own (old) Supabase project and regenerates
// src/integrations/supabase/types.ts from it. This compares that file with the
// live schema of OUR project, lists edge functions that aren't deployed, and
// lists Lovable-hosted images (*.asset.json) that have no local copy in public/.
// Exit code 1 means something needs attention before shipping.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ref = readFileSync(join(root, "supabase/config.toml"), "utf8").match(/project_id\s*=\s*"([^"]+)"/)[1];
const sh = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 });
let problems = 0;
const fail = (msg) => { problems++; console.log(`  ✗ ${msg}`); };

function parseSchema(src) {
  const out = { Tables: {}, Functions: {} };
  const pub = src.replace(/^﻿/, "").slice(src.indexOf("public: {"));
  for (const sect of Object.keys(out)) {
    const start = pub.indexOf(`    ${sect}: {`);
    if (start < 0) continue;
    let name = null, inRow = false;
    for (const l of pub.slice(start).split("\n").slice(1)) {
      if (/^    \S/.test(l)) break;
      const top = l.match(/^      (\w+):/);
      if (top) { name = top[1]; out[sect][name] = new Set(); inRow = sect === "Functions"; continue; }
      if (/^        Row: \{/.test(l)) inRow = true;
      if (/^        (Insert|Update|Relationships):/.test(l)) inRow = false;
      const col = l.match(/^          (\w+)\??:/);
      if (col && name && inRow) out[sect][name].add(col[1]);
    }
  }
  return out;
}

console.log(`\n1) Database: Lovable's types.ts vs live project ${ref}`);
const lovable = parseSchema(readFileSync(join(root, "src/integrations/supabase/types.ts"), "utf8"));
const live = parseSchema(sh(`npx supabase gen types typescript --project-id ${ref} --schema public`));
for (const sect of ["Tables", "Functions"]) {
  for (const [name, cols] of Object.entries(lovable[sect])) {
    if (!live[sect][name]) { fail(`${sect === "Tables" ? "table" : "db function"} missing: ${name}`); continue; }
    if (sect === "Tables") for (const c of cols) if (!live[sect][name].has(c)) fail(`column missing: ${name}.${c}`);
  }
}
if (!problems) console.log("  ✓ live database has everything Lovable's code expects");
console.log("    (Lovable's SQL for new tables usually lands in drizzle/migrations/)");

console.log("\n2) Edge functions deployed");
const before = problems;
const deployed = new Set(JSON.parse(sh(`npx supabase functions list --project-ref ${ref} -o json`)).map((f) => f.slug));
for (const dir of readdirSync(join(root, "supabase/functions"))) {
  if (dir.startsWith("_") || !statSync(join(root, "supabase/functions", dir)).isDirectory()) continue;
  if (!deployed.has(dir)) fail(`not deployed: ${dir}`);
}
if (problems === before) console.log("  ✓ every function in the repo is deployed (redeploy any Lovable changed)");
let lovableOnly = "";
try { lovableOnly = sh(`git grep -l -E "ai\\.gateway\\.lovable|LOVABLE_API_KEY|lovable\\.app" -- supabase/functions`).trim(); } catch { /* git grep exits 1 when nothing matches */ }
if (lovableOnly) for (const f of lovableOnly.split("\n")) fail(`uses a Lovable-only service: ${f}`);

console.log("\n3) Lovable-hosted images have local copies (public/__l5e/...)");
const beforeAssets = problems;
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
// Any Lovable-hosted path referenced anywhere in src (*.asset.json, data files, code).
const urls = new Set(walk(join(root, "src"))
  .filter((f) => /\.(json|ts|tsx|js|jsx|css)$/.test(f))
  .flatMap((f) => readFileSync(f, "utf8").match(/\/__l5e\/assets-v1\/[^"'`\s)]+/g) ?? []));
const missing = [...urls].filter((url) => !existsSync(join(root, "public", url))).length;
if (missing) fail(`${missing} image(s) only exist on Lovable's hosting — run: npm run sync:lovable-assets`);
if (problems === beforeAssets) console.log("  ✓ all images are bundled locally");

console.log("\n4) Production builds point at our backend");
const prod = existsSync(join(root, ".env.production")) ? readFileSync(join(root, ".env.production"), "utf8") : "";
if (!prod.includes(ref)) fail(".env.production is missing or doesn't point at " + ref);
else console.log("  ✓ .env.production → " + ref);

console.log(problems ? `\n${problems} problem(s) — fix before shipping.\n` : "\nAll good.\n");
process.exit(problems ? 1 : 0);
