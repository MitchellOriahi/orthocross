-- Verse of the day: curated table + deterministic day-ordinal picker.
-- Seeded with the 8 verses previously hardcoded in src/lib/verseOfTheDay.ts
-- (already-shipped app content). Add rows to lengthen the cycle; the picker
-- adapts to the active count automatically.
CREATE TABLE IF NOT EXISTS public.daily_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  verse_text text NOT NULL,
  sort_order int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (sort_order)
);

ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily verses are readable by everyone"
  ON public.daily_verses FOR SELECT USING (true);

INSERT INTO public.daily_verses (reference, verse_text, sort_order) VALUES
  ('John 3:16', 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 1),
  ('Philippians 4:13', 'I can do all things through Christ who strengthens me.', 2),
  ('Psalm 23:1', 'The Lord is my shepherd; I shall not want.', 3),
  ('Proverbs 3:5-6', 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', 4),
  ('Romans 8:28', 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 5),
  ('Isaiah 41:10', 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.', 6),
  ('Matthew 11:28', 'Come to me, all who labor and are heavy laden, and I will give you rest.', 7),
  ('Jeremiah 29:11', 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.', 8)
ON CONFLICT (sort_order) DO NOTHING;

-- Day-ordinal selection (not a digit-sum): consecutive days walk the list in
-- order and the cycle length always equals the number of active verses.
CREATE OR REPLACE FUNCTION public.get_verse_of_the_day(p_date date DEFAULT (now() AT TIME ZONE 'utc')::date)
RETURNS TABLE (reference text, verse_text text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH act AS (
    SELECT dv.reference, dv.verse_text,
           row_number() OVER (ORDER BY dv.sort_order) - 1 AS idx,
           count(*) OVER () AS total
    FROM public.daily_verses dv
    WHERE dv.active
  )
  SELECT act.reference, act.verse_text
  FROM act
  WHERE act.idx = (p_date - DATE '2026-01-01') % act.total;
$$;

-- Per-user opt-out for the morning verse push.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verse_notifications_enabled boolean NOT NULL DEFAULT true;

-- Remove stale pg_cron jobs that target edge functions which no longer exist
-- (their sends 404/401 silently; the GitHub Action is the one real scheduler).
DO $$
DECLARE r record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR r IN SELECT jobid, jobname FROM cron.job
      WHERE command LIKE '%schedule-fasting-notifications%'
         OR command LIKE '%send-streak-reminders%'
         OR command LIKE '%send-notifications%'
    LOOP
      PERFORM cron.unschedule(r.jobid);
      RAISE NOTICE 'unscheduled stale cron job % (%)', r.jobid, r.jobname;
    END LOOP;
  END IF;
END $$;
