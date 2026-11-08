ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_oriental_family text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calendar_oriental_family_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_oriental_family_check
      CHECK (calendar_oriental_family IS NULL OR calendar_oriental_family IN ('alexandrian', 'syriac', 'armenian'));
  END IF;
END $$;