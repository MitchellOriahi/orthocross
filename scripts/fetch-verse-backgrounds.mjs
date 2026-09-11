// Download public-domain / CC0 landscape photos used as Verse of the Day
// share-image backgrounds. Licenses verified via Commons API:
//  - Sunset - Sea of Galilee 3.JPG            -> Public domain
//  - Sea of Galilee at sunset DSF0254.jpg     -> CC0
//  - Orange sunrise and mountain silhouette   -> CC0 (Unsplash transfer batch)
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('src/assets/verse-backgrounds', { recursive: true });

const FILES = [
  ['Sunset_-_Sea_of_Galilee_3.JPG', 'galilee-sunset.jpg'],
  ['Sea_of_Galilee_at_sunset_DSF0254.jpg', 'galilee-dusk.jpg'],
  ['Orange_sunrise_and_mountain_silhouette_(Unsplash).jpg', 'mountain-sunrise.jpg'],
];

async function fetchWithBackoff(url, timeout) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'OrthoCrossCuration/1.0' }, signal: AbortSignal.timeout(timeout) });
    if (res.ok) return res;
    if (attempt >= 8) throw new Error(`HTTP ${res.status} after ${attempt} attempts: ${url}`);
    console.log(`throttled (${res.status}), waiting...`);
    await new Promise(r => setTimeout(r, 20000 * attempt));
  }
}

for (const [commonsName, out] of FILES) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&formatversion=2&titles=${encodeURIComponent('File:' + commonsName.replace(/_/g, ' '))}`;
  let meta;
  for (let attempt = 1; ; attempt++) {
    const raw = await (await fetchWithBackoff(api, 30000)).text();
    try { meta = JSON.parse(raw); break; } catch {
      if (attempt >= 8) throw new Error('rate-limited on API');
      console.log('API throttled, waiting...');
      await new Promise(r => setTimeout(r, 20000 * attempt));
    }
  }
  const info = meta.query.pages[0].imageinfo[0];
  const url = (info.thumburl || info.url).split('?')[0];
  const res = await fetchWithBackoff(url, 90000);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`src/assets/verse-backgrounds/${out}`, buf);
  console.log(`${out}: ${Math.round(buf.length / 1024)} KB`);
  await new Promise(r => setTimeout(r, 3000));
}
