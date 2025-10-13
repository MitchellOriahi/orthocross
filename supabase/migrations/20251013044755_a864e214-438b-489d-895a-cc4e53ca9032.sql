-- Add pinned_media_url column to journal_entries to store which media is pinned
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS pinned_media_url text,
ADD COLUMN IF NOT EXISTS pinned_media_type text CHECK (pinned_media_type IN ('image', 'video', 'audio', 'drawing'));