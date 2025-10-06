/**
 * scripture-bootstrap.ts
 * Plug in and run once to populate OSB/LXX + Oriental extras from public-domain sources.
 */
import * as cheerio from "cheerio";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------ 1) CANON/ROUTING CONFIG ------------------------ */

export const ScriptureEngineV2 = {
  active_canon_by_tab: {
    eastern_orthodox: "OSB_LXX",
    oriental_orthodox: "TEWAHEDO_81",
  },
  api: {
    mode: "disabled",
    allow_books: [],
  },
  source_priority: {
    OT: ["LXX2012"],
    NT: ["WEB"],
    TEWAHEDO: ["RH_CHARLES","CATSS"],
  },
  ui_availability_badges: {
    full_text: { label: "Full Text", color: "green" },
    sample_only: { label: "Sample", color: "amber" },
    not_loaded: { label: "Needs Import", color: "gray" }
  },
  canons: [
    {
      id: "OSB_LXX",
      display_name: "Orthodox Study Bible (LXX order)",
      order_hint: [
        "genesis","exodus","leviticus","numbers","deuteronomy",
        "joshua","judges","ruth","1kings","2kings","3kings","4kings",
        "1chronicles","2chronicles","ezra","nehemiah","esther_greek",
        "job","psalms","psalm_151","proverbs","ecclesiastes","song_of_songs",
        "isaiah","jeremiah","lamentations","ezekiel","daniel",
        "hosea","joel","amos","obadiah","jonah","micah","nahum","habakkuk","zephaniah","haggai","zechariah","malachi",
        "tobit","judith","wisdom","sirach","baruch","letter_of_jeremiah",
        "song_of_three","susanna","bel_and_dragon",
        "1esdras","prayer_of_manasseh","1maccabees","2maccabees","3maccabees","4maccabees",
        "matthew","mark","luke","john","acts","romans",
        "1corinthians","2corinthians","galatians","ephesians","philippians","colossians",
        "1thessalonians","2thessalonians","1timothy","2timothy","titus","philemon",
        "hebrews","james","1peter","2peter","1john","2john","3john","jude","revelation"
      ],
      db_only_books: [
        "tobit","judith","wisdom","sirach","baruch","letter_of_jeremiah",
        "song_of_three","susanna","bel_and_dragon","1esdras","prayer_of_manasseh",
        "1maccabees","2maccabees","3maccabees","4maccabees","psalm_151"
      ]
    },
    {
      id: "TEWAHEDO_81",
      display_name: "Ethiopian Orthodox Tewahedo (81)",
      extras_db_only: [
        { slug: "1enoch", chapters_hint: 108 },
        { slug: "jubilees", chapters_hint: 50 },
        { slug: "4baruch" },
        { slug: "meqabyan1" },
        { slug: "meqabyan2" },
        { slug: "meqabyan3" }
      ]
    }
  ]
};

/* ------------------ 2) PUBLIC-DOMAIN SOURCE ENDPOINTS -------------------- */

const LXX_INDEX = "https://ebible.org/eng-lxx2012/";
const WEB_INDEX_NT = "https://ebible.org/eng-web/";
const ENOCH_INDEX = "https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles)";
const JUBILEES_INDEX = "https://www.pseudepigrapha.com/jubilees/index.htm";
const BARUCH4_PD = "https://ccat.sas.upenn.edu/rak/publics/pseudepig/ParJer-Eng.html";
const MEQABYAN1_INDEX = "https://en.wikisource.org/wiki/Translation:1_Meqabyan";

/* ----------- 3) TYPES & HELPERS ----------- */

type Verse = { n: number; text: string };
type ChapterDoc = { slug: string; chapter: number; language: "en"; sourceCode: string; verses: Verse[] };

async function get(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.text();
}

async function saveChapter(doc: ChapterDoc, onProgress?: (msg: string) => void) {
  try {
    const versesToInsert = doc.verses.map(v => ({
      book: doc.slug,
      chapter: doc.chapter,
      verse_number: v.n,
      verse_text: v.text
    }));

    const { error } = await supabase
      .from('bible_verses')
      .upsert(versesToInsert, {
        onConflict: 'book,chapter,verse_number'
      });

    if (error) {
      console.error(`Error saving ${doc.slug} ${doc.chapter}:`, error);
      onProgress?.(`❌ ${doc.slug} ${doc.chapter}: ${error.message}`);
    } else {
      const msg = `✓ ${doc.slug} ${doc.chapter} from ${doc.sourceCode} (${doc.verses.length} verses)`;
      console.log(msg);
      onProgress?.(msg);
    }
  } catch (err) {
    console.error(`Exception saving ${doc.slug} ${doc.chapter}:`, err);
    onProgress?.(`❌ ${doc.slug} ${doc.chapter}: ${err}`);
  }
}

/* --- LXX2012 scraper --- */
async function importLXX2012_OSBExtras(onProgress?: (msg: string) => void) {
  onProgress?.("Starting LXX2012 import...");
  const html = await get(LXX_INDEX);
  const $ = cheerio.load(html);

  const mapToSlug: Record<string,string> = {
    "Tobit":"tobit","Judith":"judith","Wisdom":"wisdom","Sirach":"sirach","Baruch":"baruch",
    "Epistle of Jeremy":"letter_of_jeremiah",
    "Prayer of Azarias":"song_of_three","Susanna":"susanna","Bel and the Dragon":"bel_and_dragon",
    "I Esdras":"1esdras","Prayer of Manasses":"prayer_of_manasseh",
    "1 Maccabees":"1maccabees","2 Maccabees":"2maccabees","3 Maccabees":"3maccabees","4 Maccabees":"4maccabees",
    "Psalms":"psalms"
  };

  const targets: {slug:string; href:string}[] = [];
  $("a").each((_, a) => {
    const label = $(a).text().trim();
    if (mapToSlug[label]) {
      targets.push({ slug: mapToSlug[label], href: new URL($(a).attr("href")!, LXX_INDEX).toString() });
    }
  });

  for (const t of targets) {
    await scrapeLXXBook(t.slug, t.href, onProgress);
    if (t.slug === "psalms") {
      await scrapeLXXChapterPage("psalm_151", `${LXX_INDEX}PSA151.htm`, onProgress);
    }
  }
}

async function scrapeLXXBook(slug: string, firstPageUrl: string, onProgress?: (msg: string) => void) {
  let pageUrl = firstPageUrl;
  const visited = new Set<string>();
  while (pageUrl && !visited.has(pageUrl)) {
    visited.add(pageUrl);
    await scrapeLXXChapterPage(slug, pageUrl, onProgress);
    const $ = cheerio.load(await get(pageUrl));
    const next = $('a:contains(">")').attr("href");
    pageUrl = next ? new URL(next, pageUrl).toString() : "";
  }
}

async function scrapeLXXChapterPage(slug: string, url: string, onProgress?: (msg: string) => void) {
  const html = await get(url);
  const $ = cheerio.load(html);
  const chapNum = Number($("body").text().match(/\b(\d+)\s*$/m)?.[1] ?? $("a:contains('>')").prev().text().trim());
  const raw = $("body").text().replace(/\s+/g," ").trim();
  const verses: Verse[] = [];
  raw.split(/ (?=\d+\s)/).forEach(seg => {
    const m = seg.match(/^(\d+)\s+(.*)$/);
    if (m) verses.push({ n: Number(m[1]), text: m[2].trim() });
  });
  if (verses.length) {
    await saveChapter({ slug, chapter: chapNum || 1, language: "en", sourceCode: "LXX2012", verses }, onProgress);
  }
}

/* --- Enoch --- */
async function importEnoch(onProgress?: (msg: string) => void) {
  onProgress?.("Starting 1 Enoch import...");
  const html = await get(ENOCH_INDEX);
  const $ = cheerio.load(html);
  const chapterLinks = $("a").filter((_,a)=>/Chapter|CHAPTER/i.test($(a).text())).map((_,a)=>new URL($(a).attr("href")!, ENOCH_INDEX).toString()).get();
  let c = 0;
  for (const href of chapterLinks) {
    c++;
    const chHtml = await get(href);
    const $$ = cheerio.load(chHtml);
    const verses: Verse[] = [];
    $$("p").each((_, p) => {
      const text = $$(p).text().trim();
      text.split(/(?<=\.)\s+(?=\d+\.)/).forEach(chunk=>{
        const m = chunk.match(/^\s*(\d+)\.\s*(.*)$/);
        if (m) verses.push({ n: Number(m[1]), text: m[2] });
      });
    });
    if (verses.length) await saveChapter({ slug: "1enoch", chapter: c, language: "en", sourceCode: "RH_CHARLES", verses }, onProgress);
  }
}

/* --- Jubilees --- */
async function importJubilees(onProgress?: (msg: string) => void) {
  onProgress?.("Starting Jubilees import...");
  const indexHtml = await get(JUBILEES_INDEX);
  const $ = cheerio.load(indexHtml);
  const links = $("a").filter((_,a)=>/Chapter\s+\d+/i.test($(a).text())).map((_,a)=>new URL($(a).attr("href")!, "https://www.pseudepigrapha.com/jubilees/").toString()).get();
  let ch = 0;
  for (const href of links) {
    ch++;
    const h = await get(href);
    const $$ = cheerio.load(h);
    const verses: Verse[] = [];
    $$("#content p").each((_,p)=>{
      const t = $$(p).text().trim();
      t.split(/(?<=\.)\s+(?=\d+\.)/).forEach(seg=>{
        const m = seg.match(/^\s*(\d+)\.\s*(.+)$/);
        if (m) verses.push({ n: Number(m[1]), text: m[2] });
      });
    });
    if (verses.length) await saveChapter({ slug: "jubilees", chapter: ch, language: "en", sourceCode: "RH_CHARLES", verses }, onProgress);
  }
}

/* --- 4 Baruch --- */
async function import4Baruch(onProgress?: (msg: string) => void) {
  onProgress?.("Starting 4 Baruch import...");
  const html = await get(BARUCH4_PD);
  const $ = cheerio.load(html);
  const verses: Verse[] = [];
  $("pre, p").each((_,el)=>{
    const t = $(el).text().trim();
    const m = t.match(/^\s*(\d+)\.\s*(.+)$/);
    if (m) verses.push({ n: Number(m[1]), text: m[2] });
  });
  if (verses.length) await saveChapter({ slug: "4baruch", chapter: 1, language: "en", sourceCode: "CATSS", verses }, onProgress);
}

/* --- Meqabyan 1 --- */
async function importMeqabyan1_ifAvailable(onProgress?: (msg: string) => void) {
  onProgress?.("Attempting Meqabyan 1 import...");
  try {
    const html = await get(MEQABYAN1_INDEX);
    const $ = cheerio.load(html);
    const chLinks = $("a").filter((_,a)=>/Chapter\s+\d+/i.test($(a).text())).map((_,a)=>new URL($(a).attr("href")!, MEQABYAN1_INDEX).toString()).get();
    let c=0;
    for (const href of chLinks) {
      c++;
      const h = await get(href);
      const $$ = cheerio.load(h);
      const verses: Verse[] = [];
      $$("p").each((_,p)=>{
        const text = $$(p).text().trim();
        const m = text.match(/^\s*(\d+)\.\s*(.+)$/);
        if (m) verses.push({ n: Number(m[1]), text: m[2] });
      });
      if (verses.length) await saveChapter({ slug: "meqabyan1", chapter: c, language: "en", sourceCode: "PD_TRANS", verses }, onProgress);
    }
  } catch (err) {
    onProgress?.(`Meqabyan 1 partial or unavailable: ${err}`);
  }
}

/* ------------------------------ BOOTSTRAP -------------------------------- */

export async function runFullBootstrap(onProgress?: (msg: string) => void) {
  onProgress?.("🚀 Starting full scripture bootstrap...");
  
  try {
    await importLXX2012_OSBExtras(onProgress);
    await importEnoch(onProgress);
    await importJubilees(onProgress);
    await import4Baruch(onProgress);
    await importMeqabyan1_ifAvailable(onProgress);
    
    onProgress?.("✅ Bootstrap complete!");
    return { success: true };
  } catch (error) {
    onProgress?.(`❌ Bootstrap failed: ${error}`);
    return { success: false, error };
  }
}

/* -------------------- 4) Reader availability helper ---------------------- */

export function availabilityBadgeFor(slug: string, hasVerses: boolean): "full_text"|"not_loaded" {
  return hasVerses ? "full_text" : "not_loaded";
}
