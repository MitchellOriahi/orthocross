-- Add last read position tracking to reading_progress table
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS current_chapter integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_verse integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS book_key text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book 
ON public.reading_progress(user_id, book_key);

-- Update existing records to have default values
UPDATE public.reading_progress 
SET current_chapter = 1, current_verse = 1 
WHERE current_chapter IS NULL;