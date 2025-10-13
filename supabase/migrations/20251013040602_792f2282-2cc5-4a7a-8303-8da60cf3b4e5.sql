-- Create storage bucket for journal attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-attachments', 'journal-attachments', false);

-- RLS policies for journal attachments bucket
CREATE POLICY "Users can view their own journal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own journal attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own journal attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own journal attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachment columns to journal_entries table
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN journal_entries.attachments IS 'Array of attachment objects with type, url, and metadata';