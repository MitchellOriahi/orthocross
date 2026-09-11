// One-time repair: a PowerShell rewrite read this UTF-8 file as ANSI and
// mangled every non-ASCII character. Restore them.
import { readFileSync, writeFileSync } from 'fs';

const path = 'src/pages/ChurchResources.tsx';
let t = readFileSync(path, 'utf8');

const fixes = [
  [/â†/g, '←'],   // "â†\x90" -> ←
  [/â€”/g, '—'],   // "â€”"   -> —
  [/â€¦/g, '…'],   // "â€¦"   -> …
  [/â€™/g, '’'],   // "â€™"   -> ’
  [/â€œ/g, '“'],   // "â€œ"   -> “
  [/â€/g, '”'],   // curly close quote
];

let total = 0;
for (const [re, rep] of fixes) {
  const n = (t.match(re) || []).length;
  total += n;
  t = t.replace(re, rep);
}
writeFileSync(path, t, 'utf8');
console.log(`Repaired ${total} mangled sequences.`);
const leftovers = (t.match(/[Â-Ãâ]/g) || []).length;
console.log(`Suspicious bytes remaining: ${leftovers}`);
