
-- Fix groups SELECT policy to allow creators to see their newly created groups
-- The issue is that after INSERT with .select(), Supabase needs SELECT permission
-- but the user isn't a member yet, causing a failure

DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Allow viewing if: member OR public OR you just created it
CREATE POLICY "Users can view groups they are members of" ON public.groups
FOR SELECT
USING (
  is_group_member(id, auth.uid())
  OR is_public = true
  OR created_by = auth.uid()
);

-- Also fix the group_members INSERT policy - it currently has circular logic
-- It checks if g.created_by = auth.uid() which requires looking up groups,
-- but that triggers the groups SELECT policy. Use a simpler approach.

DROP POLICY IF EXISTS "Group owners/admins can add members" ON public.group_members;

-- Allow inserting if:
-- 1. User is adding themselves AND is the group creator (for initial membership)
-- 2. OR user is already an admin in that group (using security definer to avoid recursion)
CREATE POLICY "Group owners/admins can add members" ON public.group_members
FOR INSERT
WITH CHECK (
  (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    )
  )
  OR is_group_admin(group_id, auth.uid())
);
