CREATE OR REPLACE FUNCTION public.has_active_group_invitation(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_invitations gi
    WHERE gi.group_id = _group_id
      AND gi.invitee_id = _user_id
      AND gi.status IN ('pending', 'accepted')
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_group_invitation(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_group_invitation(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Group owners/admins can add members" ON public.group_members;
CREATE POLICY "Group owners/admins can add members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = group_members.group_id
        AND g.created_by = auth.uid()
    )
  )
  OR public.is_group_admin(group_members.group_id, auth.uid())
  OR (
    auth.uid() = user_id
    AND role = 'member'
    AND public.has_active_group_invitation(group_members.group_id, auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.guard_group_invitation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.group_id IS DISTINCT FROM OLD.group_id
     OR NEW.inviter_id IS DISTINCT FROM OLD.inviter_id
     OR NEW.invitee_id IS DISTINCT FROM OLD.invitee_id THEN
    RAISE EXCEPTION 'Cannot change invitation target or participants';
  END IF;

  IF OLD.status <> 'pending' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Invitation has already been handled';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_group_invitation_update ON public.group_invitations;
CREATE TRIGGER guard_group_invitation_update
BEFORE UPDATE ON public.group_invitations
FOR EACH ROW
EXECUTE FUNCTION public.guard_group_invitation_update();

CREATE OR REPLACE FUNCTION public.cleanup_group_invitation_on_member_remove()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.group_invitations
  WHERE group_id = OLD.group_id
    AND invitee_id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_group_invitation_on_member_remove ON public.group_members;
CREATE TRIGGER cleanup_group_invitation_on_member_remove
AFTER DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_group_invitation_on_member_remove();