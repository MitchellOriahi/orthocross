-- Add translation column to bible_verses table
ALTER TABLE public.bible_verses 
ADD COLUMN IF NOT EXISTS translation TEXT NOT NULL DEFAULT 'osb';

-- Create index for faster lookups by translation
CREATE INDEX IF NOT EXISTS idx_bible_verses_translation ON public.bible_verses(translation);

-- Update the unique constraint to include translation
-- First drop the old constraint if it exists
ALTER TABLE public.bible_verses DROP CONSTRAINT IF EXISTS bible_verses_book_chapter_verse_number_key;

-- Create new unique constraint including translation
ALTER TABLE public.bible_verses 
ADD CONSTRAINT bible_verses_book_chapter_verse_translation_key 
UNIQUE (book, chapter, verse_number, translation);