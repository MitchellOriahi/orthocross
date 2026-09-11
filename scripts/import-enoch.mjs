// Fetch R. H. Charles' translation of 1 Enoch (public domain, 1917) from
// Wikisource, parse verse-by-verse WITHOUT altering the text (Charles' critical
// brackets are preserved; only wiki markup is removed and whitespace collapsed),
// and optionally upsert into bible_verses.
//
//   node scripts/import-enoch.mjs           # fetch + parse + report only
//   node scripts/import-enoch.mjs --import  # also upsert into the database
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const CACHE = 'scripts/.cache-enoch';
const BOOK = '1 Enoch';
const TRANSLATION = 'osb'; // the app's default translation key; see Reading fallback
const UA = 'OrthoCrossImport/1.0 (Orthodox companion app; one-time import)';

mkdirSync(CACHE, { recursive: true });

async function fetchChapter(n) {
  const file = `${CACHE}/ch${n}.txt`;
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const page = `The_Book_of_Enoch_(Charles)/Chapter_${String(n).padStart(2, '0')}`;
  const url = `https://en.wikisource.org/w/api.php?action=parse&page=${page}&prop=wikitext&format=json&formatversion=2`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const raw = await res.text();
    let json;
    try { json = JSON.parse(raw); } catch { json = null; }
    if (json?.parse?.wikitext) {
      writeFileSync(file, json.parse.wikitext, 'utf8');
      await new Promise(r => setTimeout(r, 1200));
      return json.parse.wikitext;
    }
    if (json?.error) throw new Error(`ch${n}: ${json.error.info}`);
    if (attempt >= 6) throw new Error(`ch${n}: rate-limited after ${attempt} attempts`);
    process.stdout.write(`ch${n} throttled, backing off...\n`);
    await new Promise(r => setTimeout(r, 15000 * attempt));
  }
}

function parseChapter(wikitext, n) {
  let t = wikitext;
  t = t.replace(/\{\{header[\s\S]*?\}\}/, '');          // header template
  t = t.replace(/<ref[\s\S]*?<\/ref>/g, '');            // footnotes
  t = t.replace(/<[^>]+>/g, '');                        // stray html
  t = t.replace(/^=+[^=\n]*=+\s*$/gm, '');              // section headings
  t = t.replace(/^\s*CHAPTER\s+[IVXLC]+\.?\s*$/gm, ''); // chapter caption
  t = t.replace(/\[\[[^\]]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1'); // wikilinks
  t = t.replace(/\{\{[^}]*\}\}/g, '');                  // remaining templates

  // Tokenize on verse numbers, accepting a number only when it continues the
  // sequence — protects text like "70,000." from being read as a verse marker.
  const verses = [];
  let current = null;
  const parts = t.split(/(?<![\d,])(\d{1,3})\.\s+/);
  // parts[0] = preamble before verse 1 (usually empty)
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const body = parts[i + 1] ?? '';
    if (num === verses.length + 1) {
      current = { number: num, text: body };
      verses.push(current);
    } else if (current) {
      current.text += `${parts[i]}. ${body}`; // false split — glue back
    }
  }
  for (const v of verses) v.text = v.text.replace(/\s+/g, ' ').trim();
  const leftover = (parts[0] || '').replace(/\s+/g, ' ').trim();
  return { verses, leftover };
}

const all = {};
const anomalies = [];
for (let n = 1; n <= 108; n++) {
  const wikitext = await fetchChapter(n);
  const { verses, leftover } = parseChapter(wikitext, n);
  all[n] = verses;
  if (verses.length === 0) anomalies.push(`ch${n}: ZERO verses`);
  if (leftover.length > 40) anomalies.push(`ch${n}: leftover preamble ${leftover.length} chars: "${leftover.slice(0, 90)}"`);
  if (verses.some(v => v.text.length < 15)) anomalies.push(`ch${n}: suspiciously short verse`);
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
writeFileSync('scripts/.enoch-parsed.json', JSON.stringify(all, null, 1), 'utf8');

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
