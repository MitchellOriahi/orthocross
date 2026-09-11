// One-time: remove the placeholder Meqabyan verse rows (unverifiable provenance)
// so the Reading page's honest "no translation yet" label shows instead.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const ops = readFileSync('C:/Users/mitch/Documents/orthocross_app/ORTHOCROSS-OPS.md', 'utf8');
const serviceKey = ops.match(/service_role key[^`]*```\s*\n([^\s`]+)/)[1];
const url = readFileSync('.env', 'utf8').match(/^VITE_SUPABASE_URL="?([^"\r\n]+)"?$/m)[1];
const supabase = createClient(url, serviceKey);

const BOOKS = ['1 Meqabyan', '2 Meqabyan', '3 Meqabyan'];
const { data: before, error: readErr } = await supabase
  .from('bible_verses')
  .select('book, chapter, verse_number')
  .in('book', BOOKS);
if (readErr) { console.error(readErr.message); process.exit(1); }
console.log(`Rows to delete: ${before.length}`);
const { error } = await supabase.from('bible_verses').delete().in('book', BOOKS);
console.log(error ? `ERROR: ${error.message}` : 'Deleted.');
