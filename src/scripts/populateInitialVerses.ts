import { supabase } from "@/integrations/supabase/client";
import { bibleContent } from "@/data/bibleContent";

/**
 * This script populates the bible_verses table with all hardcoded content
 * Run this once to initialize the database with available verses
 */
export async function populateInitialVerses() {
  console.log('Starting to populate bible_verses table...');
  
  let totalChapters = 0;
  let totalVerses = 0;
  let errors = 0;
  
  for (const [book, chapters] of Object.entries(bibleContent)) {
    for (const [chapterStr, verses] of Object.entries(chapters)) {
      const chapter = parseInt(chapterStr);
      
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
          console.error(`Error inserting ${book} chapter ${chapter}:`, error);
          errors++;
        } else {
          totalChapters++;
          totalVerses += verses.length;
          console.log(`✓ ${book} chapter ${chapter}: ${verses.length} verses`);
        }
      } catch (error) {
        console.error(`Exception inserting ${book} chapter ${chapter}:`, error);
        errors++;
      }
    }
  }
  
  console.log('\n=== Population Summary ===');
  console.log(`Total chapters inserted: ${totalChapters}`);
  console.log(`Total verses inserted: ${totalVerses}`);
  console.log(`Errors: ${errors}`);
  
  return { totalChapters, totalVerses, errors };
}