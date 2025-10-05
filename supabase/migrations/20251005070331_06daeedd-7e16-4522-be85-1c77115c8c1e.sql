-- Add unique constraint to reading_progress table for proper upsert functionality
-- This allows the app to update existing progress instead of creating duplicates
ALTER TABLE reading_progress 
ADD CONSTRAINT reading_progress_user_book_unique 
UNIQUE (user_id, book_key, scripture_passage);