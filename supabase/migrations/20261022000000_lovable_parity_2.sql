-- Lovable parity, round 2 (pulled 2026-10-22): drizzle/migrations 0012-0015 ported
-- verbatim to our project. Omitted from 0012: the UPDATE that marks every unsent
-- leaderboard row as sent (our 20261020000100 already did that once; repeating
-- it now would drop pushes queued since). daily_verses/push_sent_at parts are
-- already present here and are IF NOT EXISTS / grants only.
BEGIN;

-- ===== drizzle 0012_notification_fixes (minus the UPDATE) =====
GRANT SELECT ON public.daily_verses TO anon, authenticated;
GRANT ALL ON public.daily_verses TO service_role;
GRANT EXECUTE ON FUNCTION public.get_verse_of_the_day(date) TO anon, authenticated, service_role;

-- Leaderboard pushes are now sent server-side; track delivery per row.
ALTER TABLE public.leaderboard_notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS leaderboard_notifications_unsent_idx
  ON public.leaderboard_notifications (created_at) WHERE push_sent_at IS NULL;

-- Private scheduler secret: no client grants, no policies; only the
-- database scheduler and the service role can read it.
CREATE TABLE IF NOT EXISTS public.scheduler_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')
);
REVOKE ALL ON public.scheduler_secrets FROM anon, authenticated;
GRANT ALL ON public.scheduler_secrets TO service_role;
ALTER TABLE public.scheduler_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.scheduler_secrets (name) VALUES ('reminders') ON CONFLICT DO NOTHING;

-- ===== drizzle 0013_journal_nested_folder_order =====
ALTER TABLE public.journal_folders ADD COLUMN IF NOT EXISTS parent_id uuid DEFAULT NULL, ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.journal_folders ADD CONSTRAINT journal_folders_owner_id_unique UNIQUE (user_id,id);
ALTER TABLE public.journal_folders ADD CONSTRAINT journal_folders_parent_owner_fk FOREIGN KEY (user_id,parent_id) REFERENCES public.journal_folders(user_id,id);
CREATE INDEX journal_folder_siblings ON public.journal_folders(user_id,parent_id,sort_order);
CREATE OR REPLACE FUNCTION public.validate_journal_folder_parent() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,0));
 IF NEW.parent_id IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM public.journal_folders WHERE id=NEW.parent_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Parent folder unavailable'; END IF;
  IF NEW.parent_id=NEW.id OR EXISTS(WITH RECURSIVE ancestors AS (SELECT id,parent_id FROM public.journal_folders WHERE id=NEW.parent_id AND user_id=NEW.user_id UNION SELECT f.id,f.parent_id FROM public.journal_folders f JOIN ancestors a ON f.id=a.parent_id WHERE f.user_id=NEW.user_id) SELECT 1 FROM ancestors WHERE id=NEW.id) THEN RAISE EXCEPTION 'Folders cannot contain themselves'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_journal_folder_parent BEFORE INSERT OR UPDATE OF parent_id,user_id ON public.journal_folders FOR EACH ROW EXECUTE FUNCTION public.validate_journal_folder_parent();
CREATE OR REPLACE FUNCTION public.promote_journal_subfolders() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN UPDATE public.journal_folders SET parent_id=OLD.parent_id WHERE parent_id=OLD.id AND user_id=OLD.user_id; RETURN OLD; END $$;
CREATE TRIGGER promote_journal_subfolders BEFORE DELETE ON public.journal_folders FOR EACH ROW EXECUTE FUNCTION public.promote_journal_subfolders();
CREATE OR REPLACE FUNCTION public.reorder_journal_folders(p_parent_id uuid,p_ids uuid[]) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE expected integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 SELECT count(*) INTO expected FROM public.journal_folders WHERE user_id=auth.uid() AND parent_id IS NOT DISTINCT FROM p_parent_id;
 IF cardinality(p_ids) <> expected OR (SELECT count(DISTINCT x) FROM unnest(p_ids) x) <> expected OR EXISTS(SELECT 1 FROM unnest(p_ids) x WHERE NOT EXISTS(SELECT 1 FROM public.journal_folders f WHERE f.id=x AND f.user_id=auth.uid() AND f.parent_id IS NOT DISTINCT FROM p_parent_id)) THEN RAISE EXCEPTION 'Folder list changed; please retry'; END IF;
 UPDATE public.journal_folders f SET sort_order=s.position-1 FROM unnest(p_ids) WITH ORDINALITY s(id,position) WHERE f.id=s.id AND f.user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.reorder_journal_folders(uuid,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reorder_journal_folders(uuid,uuid[]) TO authenticated,service_role;

-- ===== drizzle 0014_journal_folders_default_notes =====
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

-- ===== drizzle 0015_guardian_angel_monthly_grace =====
ALTER TABLE public.user_streaks ADD COLUMN IF NOT EXISTS guardian_last_save_month text;

CREATE OR REPLACE FUNCTION public.process_streak_check()
 RETURNS TABLE(saved boolean, current_streak integer, guardian_angel_saves integer, guardian_angel_percentage integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_streaks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_month text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_saved boolean := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.user_streaks WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND OR v_row.last_activity_date IS NULL THEN RETURN; END IF;
  IF v_today - v_row.last_activity_date <= 1 THEN RETURN; END IF;
  IF COALESCE(v_row.current_streak, 0) = 0 THEN RETURN; END IF;

  -- One guaranteed save per calendar month for consistent readers (7+ day streak)
  IF v_row.current_streak >= 7 AND v_row.guardian_last_save_month IS DISTINCT FROM v_month THEN
    UPDATE public.user_streaks
       SET guardian_angel_saves = COALESCE(guardian_angel_saves,0) + 1,
           guardian_last_save_month = v_month,
           last_activity_date = v_today - 1,
           updated_at = now()
     WHERE user_id = v_user_id
     RETURNING * INTO v_row;
    v_saved := true;
  ELSE
    PERFORM public.apply_streak_loss_penalty();
    UPDATE public.user_streaks
       SET current_streak = 0, last_activity_date = NULL, updated_at = now()
     WHERE user_id = v_user_id
     RETURNING * INTO v_row;
  END IF;

  -- guardian_angel_percentage now reports whether this month's grace is still available (100) or used (0)
  RETURN QUERY SELECT v_saved, v_row.current_streak, v_row.guardian_angel_saves,
    CASE WHEN v_row.guardian_last_save_month IS DISTINCT FROM v_month THEN 100 ELSE 0 END;
END; $function$;

NOTIFY pgrst, 'reload schema';

COMMIT;
