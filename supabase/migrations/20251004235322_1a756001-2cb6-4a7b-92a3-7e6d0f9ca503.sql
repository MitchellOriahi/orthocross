-- Create function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create reading_progress table to track user's scripture reading
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scripture_title TEXT NOT NULL,
  scripture_passage TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own reading progress
CREATE POLICY "Users can view their own reading progress"
ON public.reading_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reading progress
CREATE POLICY "Users can insert their own reading progress"
ON public.reading_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reading progress
CREATE POLICY "Users can update their own reading progress"
ON public.reading_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reading progress
CREATE POLICY "Users can delete their own reading progress"
ON public.reading_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_reading_progress_updated_at
BEFORE UPDATE ON public.reading_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();