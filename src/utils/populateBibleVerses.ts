import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to batch insert Bible verses into the database
 * This can be used to populate content from text files or APIs
 */
export async function populateBibleVerses(
  book: string,
  chapter: number,
  verses: Array<{ number: number; text: string }>
) {
  try {
    const versesToInsert = verses.map(v => ({
      book,
      chapter,
      verse_number: v.number,
      verse_text: v.text
    }));
    
    const { error } = await supabase
      .from('bible_verses')
      .upsert(versesToInsert, {
        onConflict: 'book,chapter,verse_number'
      });
    
    if (error) {
      console.error(`Error inserting verses for ${book} ${chapter}:`, error);
      return false;
    }
    
    console.log(`Successfully inserted ${verses.length} verses for ${book} ${chapter}`);
    return true;
  } catch (error) {
    console.error('Error in populateBibleVerses:', error);
    return false;
  }
}

/**
 * Populate verses from a JSON structure
 */
export async function populateFromJSON(
  content: Record<string, Record<number, Array<{ number: number; text: string }>>>
) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const [book, chapters] of Object.entries(content)) {
    for (const [chapterStr, verses] of Object.entries(chapters)) {
      const chapter = parseInt(chapterStr);
      const success = await populateBibleVerses(book, chapter, verses);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
  }
  
  console.log(`Population complete: ${successCount} chapters inserted, ${errorCount} errors`);
  return { successCount, errorCount };
}