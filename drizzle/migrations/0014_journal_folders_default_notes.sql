ALTER TABLE public.journal_folders ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Each account keeps at most one default folder; a partial unique index makes double-seeding impossible.
CREATE UNIQUE INDEX IF NOT EXISTS journal_folders_one_default_per_user
  ON public.journal_folders (user_id)
  WHERE is_default;

-- Adopt folders the user already named "Notes" so seeding cannot create a duplicate.
WITH first_notes AS (
  SELECT DISTINCT ON (user_id) id
  FROM public.journal_folders
  WHERE parent_id IS NULL AND lower(btrim(name)) = 'notes'
  ORDER BY user_id, created_at ASC
)
UPDATE public.journal_folders f
SET is_default = true
FROM first_notes fn
WHERE f.id = fn.id;