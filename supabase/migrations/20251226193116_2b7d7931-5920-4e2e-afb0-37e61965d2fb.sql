-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Group owners/admins can add members" ON public.group_members;

-- Create a fixed INSERT policy that doesn't cause infinite recursion
CREATE POLICY "Group owners/admins can add members" ON public.group_members
FOR INSERT
WITH CHECK (
  -- Allow group creator to add themselves as owner
  (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = group_members.group_id 
    AND groups.created_by = auth.uid()
  ))
  OR
  -- Allow existing owners/admins to add other members
  (EXISTS (
    SELECT 1 FROM group_members AS existing_members
    WHERE existing_members.group_id = group_members.group_id
    AND existing_members.user_id = auth.uid()
    AND existing_members.role IN ('owner', 'admin')
  ))
);