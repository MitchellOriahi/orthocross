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