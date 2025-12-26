-- Fix infinite recursion in RLS policies on public.group_members by using SECURITY DEFINER helper functions

-- 1) Helper: is the given user an owner/admin of the group?
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = _group_id
      AND gm.user_id = _user_id
      AND gm.role IN ('owner','admin')
  );
$$;

-- 2) Helper: is the given user a member of the group?
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = _group_id
      AND gm.user_id = _user_id
  );
$$;

-- 3) Replace policies that referenced group_members from within group_members policies
DROP POLICY IF EXISTS "Group owners/admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners/admins can remove members or users can leave" ON public.group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;

-- INSERT
CREATE POLICY "Group owners/admins can add members" ON public.group_members
FOR INSERT
WITH CHECK (
  -- Allow group creator to add themselves as owner (used right after group creation)
  (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = group_members.group_id
        AND g.created_by = auth.uid()
    )
  )
  OR
  -- Allow existing owners/admins to add members (no recursion via helper)
  public.is_group_admin(group_members.group_id, auth.uid())
);

-- DELETE
CREATE POLICY "Group owners/admins can remove members or users can leave" ON public.group_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_group_admin(group_members.group_id, auth.uid())
);

-- SELECT
CREATE POLICY "Users can view members of their groups" ON public.group_members
FOR SELECT
USING (
  public.is_group_member(group_members.group_id, auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = group_members.group_id
      AND g.is_public = true
  )
);
