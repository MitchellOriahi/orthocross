// One-time: wrap key historical terms in **bold** inside historyContent.ts
// reading strings ONLY (lines starting with `reading:`), first occurrence per
// reading. Words themselves are never altered — formatting markers only.
import { readFileSync, writeFileSync } from 'fs';

const TERMS = [
  'Day of Pentecost', 'Holy Spirit', 'martyrs', 'Ignatius of Antioch',
  'Polycarp of Smyrna', 'Apostolic Fathers', 'Apostolic Succession',
  'Edict of Milan', 'Constantine', 'Council of Nicaea', 'Nicene Creed',
  'Arius', 'Council of Chalcedon', 'Council of Ephesus', 'Theotokos',
  'Hagia Sophia', 'Justinian', 'iconoclasm', 'Seventh Ecumenical Council',
  'Great Schism', 'filioque', 'Cyril and Methodius', 'Vladimir',
  'Mount Athos', 'hesychasm', 'Gregory Palamas', 'Jesus Prayer',
  'Constantinople fell', 'Fall of Constantinople', 'Ottoman', 'Ecumenical Patriarch',
  'New Martyrs', 'diaspora', 'autocephalous',
  'Saint Mark', 'Coptic', 'Miaphysite', 'miaphysite', 'Nestorius',
  'Saint Anthony', 'Desert Fathers', 'monasticism',
  'Gregory the Illuminator', 'Etchmiadzin', 'Armenian Genocide',
  'Lalibela', "Ge'ez", 'Axum', 'Tewahedo', 'Syriac', 'Kebra Nagast',
  'Frumentius', 'Athanasius', 'Severus of Antioch', 'Dioscorus',
];

const path = 'src/data/historyContent.ts';
const lines = readFileSync(path, 'utf8').split('\n');
let total = 0;
const out = lines.map(line => {
  if (!/^\s*reading: "/.test(line)) return line;
  let l = line;
  for (const term of TERMS) {
    if (l.includes(`**${term}**`)) continue;
    const re = new RegExp(`(?<![\\w*])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w*])`);
    if (re.test(l)) {
      l = l.replace(re, `**${term}**`);
      total++;
    }
  }
  return l;
});
writeFileSync(path, out.join('\n'), 'utf8');
console.log(`Bolded ${total} term occurrences across reading lines.`);
