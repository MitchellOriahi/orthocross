-- Create table for verse highlights
CREATE TABLE public.verse_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scripture_title TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  highlight_color TEXT DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, scripture_title, chapter, verse_number)
);

-- Enable RLS
ALTER TABLE public.verse_highlights ENABLE ROW LEVEL SECURITY;

-- Create policies for verse highlights
CREATE POLICY "Users can view their own highlights"
ON public.verse_highlights
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights"
ON public.verse_highlights
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
ON public.verse_highlights
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
ON public.verse_highlights
FOR DELETE
USING (auth.uid() = user_id);