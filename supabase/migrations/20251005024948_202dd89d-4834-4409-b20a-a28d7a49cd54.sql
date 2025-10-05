-- Create folders table for journal organization
CREATE TABLE public.journal_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on folders
ALTER TABLE public.journal_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view their own folders"
  ON public.journal_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON public.journal_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.journal_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.journal_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Add folder_id and title to journal_entries
ALTER TABLE public.journal_entries 
  ADD COLUMN folder_id uuid REFERENCES public.journal_folders(id) ON DELETE SET NULL,
  ADD COLUMN title text;

-- Add trigger for folder updated_at
CREATE TRIGGER update_journal_folders_updated_at
  BEFORE UPDATE ON public.journal_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();