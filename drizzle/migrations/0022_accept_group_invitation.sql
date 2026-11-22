CREATE OR REPLACE FUNCTION public.accept_group_invitation(p_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT gi.group_id INTO v_group_id
  FROM public.group_invitations gi
  WHERE gi.id = p_invitation_id
    AND gi.invitee_id = auth.uid()
    AND gi.status IN ('pending', 'accepted')
  FOR UPDATE;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  UPDATE public.group_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = p_invitation_id;

  UPDATE public.group_invitation_notifications
  SET read = true
  WHERE invitation_id = p_invitation_id AND user_id = auth.uid();

  RETURN v_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_group_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_group_invitation(uuid) TO authenticated;