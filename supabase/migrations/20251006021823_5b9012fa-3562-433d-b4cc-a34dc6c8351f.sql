-- Create bible_verses table to store all scripture content
CREATE TABLE public.bible_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate verses
CREATE UNIQUE INDEX bible_verses_book_chapter_verse_unique 
ON public.bible_verses(book, chapter, verse_number);

-- Create index for faster lookups
CREATE INDEX bible_verses_book_chapter_idx 
ON public.bible_verses(book, chapter);

-- Enable RLS
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read verses (public content)
CREATE POLICY "Everyone can view verses" 
ON public.bible_verses 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update verses (for admin purposes)
CREATE POLICY "Authenticated users can insert verses" 
ON public.bible_verses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update verses" 
ON public.bible_verses 
FOR UPDATE 
TO authenticated
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_bible_verses_updated_at
BEFORE UPDATE ON public.bible_verses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();