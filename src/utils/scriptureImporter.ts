import { supabase } from "@/integrations/supabase/client";

interface ImportVerse {
  n: number;
  text: string;
}

interface ImportChapter {
  number: number;
  verses: ImportVerse[];
}

interface ImportPayload {
  book: {
    slug: string;
    name: string;
  };
  source_code: string;
  language: string;
  chapters: ImportChapter[];
}

export async function importFromJSON(payload: ImportPayload) {
  const { book, chapters } = payload;
  let totalVerses = 0;
  const errors: string[] = [];

  for (const chapter of chapters) {
    try {
      const versesToInsert = chapter.verses.map(v => ({
        book: book.name,
        chapter: chapter.number,
        verse_number: v.n,
        verse_text: v.text
      }));

      const { error } = await supabase
        .from('bible_verses')
        .upsert(versesToInsert, {
          onConflict: 'book,chapter,verse_number'
        });

      if (error) {
        errors.push(`Chapter ${chapter.number}: ${error.message}`);
      } else {
        totalVerses += chapter.verses.length;
      }
    } catch (err) {
      errors.push(`Chapter ${chapter.number}: ${err}`);
    }
  }

  return {
    success: errors.length === 0,
    totalVerses,
    totalChapters: chapters.length,
    errors
  };
}

export async function importFromCSV(csvText: string) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const verses: Array<{
    book: string;
    chapter: number;
    verse_number: number;
    verse_text: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 7) continue;

    verses.push({
      book: values[1], // book_name
      chapter: parseInt(values[4]),
      verse_number: parseInt(values[5]),
      verse_text: values[6]
    });
  }

  if (verses.length === 0) {
    return { success: false, totalVerses: 0, errors: ['No valid verses found in CSV'] };
  }

  const { error } = await supabase
    .from('bible_verses')
    .upsert(verses, {
      onConflict: 'book,chapter,verse_number'
    });

  if (error) {
    return { success: false, totalVerses: 0, errors: [error.message] };
  }

  return {
    success: true,
    totalVerses: verses.length,
    errors: []
  };
}
