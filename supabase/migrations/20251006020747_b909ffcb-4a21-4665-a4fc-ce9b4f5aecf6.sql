-- Create verse_bookmarks table
CREATE TABLE public.verse_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scripture_title TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verse_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookmarks" 
ON public.verse_bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.verse_bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.verse_bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX verse_bookmarks_user_verse_unique 
ON public.verse_bookmarks(user_id, scripture_title, chapter, verse_number);