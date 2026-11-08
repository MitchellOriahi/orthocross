ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_system text NOT NULL DEFAULT 'Gregorian';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_tradition text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calendar_system_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_system_check
      CHECK (calendar_system IN ('Gregorian', 'Julian'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calendar_tradition_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_tradition_check
      CHECK (calendar_tradition IS NULL OR calendar_tradition IN ('Eastern Orthodox', 'Oriental Orthodox'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.widget_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT widget_tokens_label_length CHECK (label IS NULL OR char_length(label) <= 60)
);

CREATE INDEX IF NOT EXISTS widget_tokens_user_active_idx
  ON public.widget_tokens (user_id) WHERE revoked_at IS NULL;

REVOKE ALL ON public.widget_tokens FROM anon;
REVOKE ALL ON public.widget_tokens FROM authenticated;
GRANT SELECT (id, user_id, label, created_at, last_used_at, revoked_at) ON public.widget_tokens TO authenticated;
GRANT ALL ON public.widget_tokens TO service_role;

ALTER TABLE public.widget_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own widget connections" ON public.widget_tokens;
CREATE POLICY "Users can view their own widget connections"
  ON public.widget_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);