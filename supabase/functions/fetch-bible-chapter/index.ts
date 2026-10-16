import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Translations supported by bible-api.com (public domain only)
const supportedTranslations = new Set([
  'kjv', 'web', 'asv', 'bbe', 'dra', 'ylt', 'darby', 'webbe', 'oeb-us', 'oeb-cw', 'clementine'
]);
// OSB is not available via the public API; fall back to KJV for unimported chapters.
const translationFallback: Record<string, string> = {
  'osb': 'kjv',
};


// Other-language Bibles: id -> source for Old and New Testament (books numbered 1-66).
type Src = { provider: 'bolls' | 'getbible'; code: string };
const b = (code: string): Src => ({ provider: 'bolls', code });
const externalSources: Record<string, { ot: Src; nt: Src }> = {
  'ru-synod': { ot: b('SYNOD'), nt: b('SYNOD') },
  'el-lxx': { ot: b('LXX'), nt: b('TR') },
  'ar-svd': { ot: b('SVD'), nt: b('SVD') },
  'ro-vdcl': { ot: b('VDCL'), nt: b('VDCL') },
  'es-rv1960': { ot: b('RV1960'), nt: b('RV1960') },
  'fr-lsg': { ot: b('FRLSG'), nt: b('FRLSG') },
  'uk-ubio': { ot: b('UBIO'), nt: b('UBIO') },
  'pt-arc': { ot: b('ARC09'), nt: b('ARC09') },
  'he-wlc': { ot: b('WLC'), nt: b('DHNT') },
  'ml-mov': { ot: b('MOV'), nt: b('MOV') },
  'sr-dk': { ot: { provider: 'getbible', code: 'srkdekavski' }, nt: { provider: 'getbible', code: 'srkdekavski' } },
};


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { book, chapter, translation = 'osb' } = await req.json();

    // Validate chapter parameter
    if (!chapter || typeof chapter !== 'number' || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
      return new Response(
        JSON.stringify({ error: 'Invalid chapter number. Must be between 1 and 150', verses: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate book parameter
    if (!book || typeof book !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid book name', verses: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map book names to Bible API format
    const bookMap: Record<string, string> = {
      "Genesis": "Genesis", "Exodus": "Exodus", "Leviticus": "Leviticus", 
      "Numbers": "Numbers", "Deuteronomy": "Deuteronomy", "Joshua": "Joshua",
      "Judges": "Judges", "Ruth": "Ruth", "1 Samuel": "1Samuel", "2 Samuel": "2Samuel",
      "1 Kings": "1Kings", "2 Kings": "2Kings", "1 Chronicles": "1Chronicles",
      "2 Chronicles": "2Chronicles", "Ezra": "Ezra", "Nehemiah": "Nehemiah",
      "Esther": "Esther", "Job": "Job", "Psalms": "Psalms", "Proverbs": "Proverbs",
      "Ecclesiastes": "Ecclesiastes", "Song of Songs": "SongofSolomon",
      "Isaiah": "Isaiah", "Jeremiah": "Jeremiah", "Lamentations": "Lamentations",
      "Ezekiel": "Ezekiel", "Daniel": "Daniel", "Hosea": "Hosea", "Joel": "Joel",
      "Amos": "Amos", "Obadiah": "Obadiah", "Jonah": "Jonah", "Micah": "Micah",
      "Nahum": "Nahum", "Habakkuk": "Habakkuk", "Zephaniah": "Zephaniah",
      "Haggai": "Haggai", "Zechariah": "Zechariah", "Malachi": "Malachi",
      "Matthew": "Matthew", "Mark": "Mark", "Luke": "Luke", "John": "John",
      "Acts": "Acts", "Romans": "Romans", "1 Corinthians": "1Corinthians",
      "2 Corinthians": "2Corinthians", "Galatians": "Galatians", "Ephesians": "Ephesians",
      "Philippians": "Philippians", "Colossians": "Colossians", "1 Thessalonians": "1Thessalonians",
      "2 Thessalonians": "2Thessalonians", "1 Timothy": "1Timothy", "2 Timothy": "2Timothy",
      "Titus": "Titus", "Philemon": "Philemon", "Hebrews": "Hebrews", "James": "James",
      "1 Peter": "1Peter", "2 Peter": "2Peter", "1 John": "1John", "2 John": "2John",
      "3 John": "3John", "Jude": "Jude", "Revelation": "Revelation"
    };

    const apiBookName = bookMap[book];
    if (!apiBookName) {
      return new Response(
        JSON.stringify({ error: "Book not found in API", verses: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const requested = (translation || 'kjv').toLowerCase();
    const bookNumber = Object.keys(bookMap).indexOf(book) + 1;
    const isOT = bookNumber <= 39;
    const external = externalSources[requested];
    let verses: { number: number; text: string }[];
    let apiTranslation = requested;

    if (external) {
      const src = isOT ? external.ot : external.nt;
      const url = src.provider === 'bolls'
        ? `https://bolls.life/get-text/${src.code}/${bookNumber}/${chapter}/`
        : `https://api.getbible.net/v2/${src.code}/${bookNumber}/${chapter}.json`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Bible source error: ${r.status}`);
      const j = await r.json();
      const raw = src.provider === 'bolls' ? j : j.verses;
      verses = (raw || []).map((v: any) => ({
        number: v.verse,
        text: String(v.text).replace(/<S>\d+<\/S>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      }));
    } else {
      apiTranslation = supportedTranslations.has(requested)
        ? requested
        : (translationFallback[requested] || 'kjv');
      const response = await fetch(`https://bible-api.com/${apiBookName}${chapter}?translation=${apiTranslation}`);
      if (!response.ok) throw new Error(`Bible API error: ${response.status}`);
      const data = await response.json();
      verses = data.verses.map((v: any) => ({ number: v.verse, text: v.text.trim() }));
    }

    return new Response(
      JSON.stringify({ verses, translation: apiTranslation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching Bible chapter:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", verses: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
