-- Create table to track completed chapters
CREATE TABLE IF NOT EXISTS public.completed_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_key TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_key, chapter)
);

-- Enable Row Level Security
ALTER TABLE public.completed_chapters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own completed chapters"
ON public.completed_chapters
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed chapters"
ON public.completed_chapters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed chapters"
ON public.completed_chapters
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_completed_chapters_user_book ON public.completed_chapters(user_id, book_key);