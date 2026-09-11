// Fetch R. H. Charles' translation of the Book of Jubilees (public domain, 1902)
// from pseudepigrapha.com, one page per chapter, verses as <li> items.
// Text is preserved as-is; only markup is removed and whitespace collapsed.
// Note: chapter 1's page carries the book's unnumbered Prologue in a blockquote
// before the chapter proper — it is NOT imported (kept out rather than forced
// into a verse number that would shift Charles' versification).
//
//   node scripts/import-jubilees.mjs           # fetch + parse + report only
//   node scripts/import-jubilees.mjs --import  # also upsert into the database
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const CACHE = 'scripts/.cache-jubilees';
const BOOK = 'Jubilees';
const TRANSLATION = 'osb';
mkdirSync(CACHE, { recursive: true });

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d));

async function fetchChapter(n) {
  const file = `${CACHE}/ch${n}.htm`;
  if (existsSync(file)) return readFileSync(file, 'utf8');
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`https://www.pseudepigrapha.com/jubilees/${n}.htm`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (OrthoCross one-time import)' },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      writeFileSync(file, html, 'utf8');
      await new Promise(r => setTimeout(r, 900));
      return html;
    } catch (e) {
      if (attempt >= 5) throw new Error(`ch${n}: ${e.message}`);
      await new Promise(r => setTimeout(r, 8000 * attempt));
    }
  }
}

function parseChapter(html, n) {
  const afterHeading = html.split(/\[Chapter \d+\]/i)[1] ?? html;
  const body = afterHeading.split(/<\/ol>/i).slice(0, -1).join('</ol>') || afterHeading;
  const items = body.split(/<li[^>]*>/i).slice(1);
  const verses = items.map((chunk, i) => {
    let t = chunk.split(/<\/ol|<h5|<hr|<\/body/i)[0];
    t = t.replace(/<[^>]+>/g, '');
    t = decode(t).replace(/\s+/g, ' ').trim();
    return { number: i + 1, text: t };
  }).filter(v => v.text.length > 0);
  return verses;
}

const all = {};
const anomalies = [];
for (let n = 1; n <= 50; n++) {
  const html = await fetchChapter(n);
  const verses = parseChapter(html, n);
  all[n] = verses;
  if (verses.length === 0) anomalies.push(`ch${n}: ZERO verses`);
  if (verses.some(v => v.text.length < 10)) anomalies.push(`ch${n}: suspiciously short verse`);
}

const totalVerses = Object.values(all).reduce((s, v) => s + v.length, 0);
console.log(`Parsed ${Object.keys(all).length} chapters, ${totalVerses} verses.`);
console.log('Verses per chapter:', Object.entries(all).map(([c, v]) => `${c}:${v.length}`).join(' '));
if (anomalies.length) {
  console.log('\nANOMALIES:');
  anomalies.forEach(a => console.log('  ' + a));
} else {
  console.log('No anomalies.');
}
writeFileSync('scripts/.jubilees-parsed.json', JSON.stringify(all, null, 1), 'utf8');

if (process.argv.includes('--import')) {
  const ops = readFileSync('C:/Users/mitch/Documents/orthocross_app/ORTHOCROSS-OPS.md', 'utf8');
  const serviceKey = ops.match(/service_role key[^`]*```\s*\n([^\s`]+)/)[1];
  const url = readFileSync('.env', 'utf8').match(/^VITE_SUPABASE_URL="?([^"\r\n]+)"?$/m)[1];
  const supabase = createClient(url, serviceKey);

  let written = 0;
  for (const [chapter, verses] of Object.entries(all)) {
    if (!verses.length) continue;
    const rows = verses.map(v => ({
      book: BOOK,
      chapter: Number(chapter),
      verse_number: v.number,
      verse_text: v.text,
      translation: TRANSLATION,
    }));
    const { error } = await supabase
      .from('bible_verses')
      .upsert(rows, { onConflict: 'book,chapter,verse_number,translation' });
    if (error) { console.error(`ch${chapter} FAILED:`, error.message); process.exit(1); }
    written += rows.length;
  }
  console.log(`\nUpserted ${written} verses into bible_verses as "${BOOK}" (${TRANSLATION}).`);
}
