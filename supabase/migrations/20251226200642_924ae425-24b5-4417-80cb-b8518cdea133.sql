-- Fix infinite recursion between groups <-> group_members RLS by using SECURITY DEFINER helpers

-- Ensure helpers exist (idempotent)
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

-- Owner check for destructive actions on groups
CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid)
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
      AND gm.role = 'owner'
  );
$$;

-- Recreate groups policies to avoid referencing group_members directly (prevents recursion)
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Group owners/admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group owners can delete groups" ON public.groups;

-- SELECT: public groups OR member via security definer helper
CREATE POLICY "Users can view groups they are members of" ON public.groups
FOR SELECT
USING (
  public.is_group_member(groups.id, auth.uid())
  OR groups.is_public = true
);

-- UPDATE: only admins/owners via helper
CREATE POLICY "Group owners/admins can update groups" ON public.groups
FOR UPDATE
USING (
  public.is_group_admin(groups.id, auth.uid())
);

-- DELETE: only owners via helper
CREATE POLICY "Group owners can delete groups" ON public.groups
FOR DELETE
USING (
  public.is_group_owner(groups.id, auth.uid())
);
