-- Create table for pinned prayers
CREATE TABLE IF NOT EXISTS public.pinned_prayers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_id TEXT NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, prayer_id)
);

-- Enable Row Level Security
ALTER TABLE public.pinned_prayers ENABLE ROW LEVEL SECURITY;

-- Create policies for pinned prayers
CREATE POLICY "Users can view their own pinned prayers"
ON public.pinned_prayers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can pin their own prayers"
ON public.pinned_prayers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unpin their own prayers"
ON public.pinned_prayers
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_pinned_prayers_user_id ON public.pinned_prayers(user_id);

-- Create table for prayer highlights
CREATE TABLE IF NOT EXISTS public.prayer_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_id TEXT NOT NULL,
  sentence_index INTEGER NOT NULL,
  highlight_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, prayer_id, sentence_index)
);

-- Enable Row Level Security
ALTER TABLE public.prayer_highlights ENABLE ROW LEVEL SECURITY;

-- Create policies for prayer highlights
CREATE POLICY "Users can view their own prayer highlights"
ON public.prayer_highlights
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prayer highlights"
ON public.prayer_highlights
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer highlights"
ON public.prayer_highlights
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer highlights"
ON public.prayer_highlights
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_prayer_highlights_user_prayer ON public.prayer_highlights(user_id, prayer_id);