-- Create table for history content highlights
CREATE TABLE public.history_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,
  island_id TEXT NOT NULL,
  sentence_index INTEGER NOT NULL,
  highlight_color TEXT DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, island_id, sentence_index)
);

-- Enable Row Level Security
ALTER TABLE public.history_highlights ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own highlights" 
ON public.history_highlights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights" 
ON public.history_highlights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" 
ON public.history_highlights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" 
ON public.history_highlights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_history_highlights_user_campaign_island 
ON public.history_highlights(user_id, campaign_id, island_id);