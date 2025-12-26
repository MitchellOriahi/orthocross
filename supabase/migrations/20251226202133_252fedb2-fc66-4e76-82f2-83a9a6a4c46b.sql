
-- Add CASCADE DELETE constraints for group-related tables
-- This ensures when a group is deleted, all related data is cleaned up

-- First, check and add foreign key with cascade for group_members
ALTER TABLE public.group_members 
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;

ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- group_activities
ALTER TABLE public.group_activities 
DROP CONSTRAINT IF EXISTS group_activities_group_id_fkey;

ALTER TABLE public.group_activities 
ADD CONSTRAINT group_activities_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- group_invitations
ALTER TABLE public.group_invitations 
DROP CONSTRAINT IF EXISTS group_invitations_group_id_fkey;

ALTER TABLE public.group_invitations 
ADD CONSTRAINT group_invitations_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- group_join_requests
ALTER TABLE public.group_join_requests 
DROP CONSTRAINT IF EXISTS group_join_requests_group_id_fkey;

ALTER TABLE public.group_join_requests 
ADD CONSTRAINT group_join_requests_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- group_monthly_rankings
ALTER TABLE public.group_monthly_rankings 
DROP CONSTRAINT IF EXISTS group_monthly_rankings_group_id_fkey;

ALTER TABLE public.group_monthly_rankings 
ADD CONSTRAINT group_monthly_rankings_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- pinned_groups
ALTER TABLE public.pinned_groups 
DROP CONSTRAINT IF EXISTS pinned_groups_group_id_fkey;

ALTER TABLE public.pinned_groups 
ADD CONSTRAINT pinned_groups_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
