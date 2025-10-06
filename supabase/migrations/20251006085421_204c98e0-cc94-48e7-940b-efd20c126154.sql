-- Add pinned column to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN pinned boolean NOT NULL DEFAULT false;

-- Add index for pinned notes queries
CREATE INDEX idx_journal_entries_pinned ON public.journal_entries(user_id, pinned, updated_at DESC);