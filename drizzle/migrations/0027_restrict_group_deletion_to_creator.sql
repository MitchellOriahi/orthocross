DROP POLICY IF EXISTS "Group owners can delete groups" ON public.groups;
CREATE POLICY "Group creators can delete groups" ON public.groups FOR DELETE TO authenticated USING (created_by = (SELECT auth.uid()));
CREATE OR REPLACE FUNCTION public.preserve_group_creator()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'The original group creator cannot be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.preserve_group_creator() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER preserve_group_creator BEFORE UPDATE OF created_by ON public.groups FOR EACH ROW EXECUTE FUNCTION public.preserve_group_creator();