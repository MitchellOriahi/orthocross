-- Lock down user_roles table with explicit DENY policies
-- Only system/admin can modify roles to prevent privilege escalation

-- Drop existing SELECT policy and recreate with better security
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Explicitly DENY all INSERT/UPDATE/DELETE operations
-- Roles should only be managed by database administrators via SQL console
CREATE POLICY "Deny all inserts on user_roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny all updates on user_roles"
  ON public.user_roles
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny all deletes on user_roles"
  ON public.user_roles
  FOR DELETE
  USING (false);

-- Note: To assign admin roles, database administrators must use the SQL editor:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<user_uuid>', 'admin');