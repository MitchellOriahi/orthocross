-- Add unique constraint to reading_progress table for the upsert operation
CREATE UNIQUE INDEX IF NOT EXISTS reading_progress_user_title_passage_unique 
ON public.reading_progress(user_id, scripture_title, scripture_passage);