// Download curated public-domain slide artwork from Wikimedia Commons.
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('src/assets/history/slides', { recursive: true });

const FILES = [
  ['https://upload.wikimedia.org/wikipedia/commons/d/d4/The_Descent_of_the_Holy_Spirit_Novgorod.jpeg', 'eo1-pentecost.jpg'],
  ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Synaxis_of_the_Twelve_Apostles_by_Constantinople_master_%28early_14th_c.%2C_Pushkin_museum%29.jpg/960px-Synaxis_of_the_Twelve_Apostles_by_Constantinople_master_%28early_14th_c.%2C_Pushkin_museum%29.jpg', 'eo1-apostles.jpg'],
  ['https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Ignatius_of_Antioch_%28Menologion_of_Basil_II%29.jpg/960px-Ignatius_of_Antioch_%28Menologion_of_Basil_II%29.jpg', 'eo1-ignatius.jpg'],
  ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Polycarp_of_Smyrna%2C_Menologion_of_Basil_II.png/960px-Polycarp_of_Smyrna%2C_Menologion_of_Basil_II.png', 'eo1-polycarp.png'],
];

for (const [url, name] of FILES) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OrthoCrossCuration/1.0 (one-time asset download)' },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) { console.error(`${name}: HTTP ${res.status}`); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`src/assets/history/slides/${name}`, buf);
  console.log(`${name}: ${Math.round(buf.length / 1024)} KB`);
}
