-- Add journal view preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN journal_view_mode text DEFAULT 'list' CHECK (journal_view_mode IN ('list', 'gallery'));