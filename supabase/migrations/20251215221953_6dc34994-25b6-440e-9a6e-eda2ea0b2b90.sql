
-- Create groups table
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Create group invitations table
CREATE TABLE public.group_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (group_id, invitee_id)
);

-- Create group join requests table (for users requesting to join public groups)
CREATE TABLE public.group_join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Create group monthly rankings table (tracks rankings and consecutive wins)
CREATE TABLE public.group_monthly_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  month_date text NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  rank integer,
  consecutive_rank_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id, month_date)
);

-- Create group activities table
CREATE TABLE public.group_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  activity_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group invitation notifications table
CREATE TABLE public.group_invitation_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id uuid NOT NULL REFERENCES public.group_invitations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_monthly_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitation_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view groups they are members of" ON public.groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid())
    OR is_public = true
  );

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners/admins can update groups" ON public.groups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Group owners can delete groups" ON public.groups
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'owner')
  );

-- RLS Policies for group_members
CREATE POLICY "Users can view members of their groups" ON public.group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.is_public = true)
  );

CREATE POLICY "Group owners/admins can add members" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_members.group_id AND created_by = auth.uid()))
  );

CREATE POLICY "Group owners/admins can remove members or users can leave" ON public.group_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin'))
  );

-- RLS Policies for group_invitations
CREATE POLICY "Users can view invitations sent to them or by them" ON public.group_invitations
  FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Group members can send invitations" ON public.group_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id
    AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_invitations.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Invitees can update their invitations" ON public.group_invitations
  FOR UPDATE USING (auth.uid() = invitee_id);

CREATE POLICY "Inviters can delete their invitations" ON public.group_invitations
  FOR DELETE USING (auth.uid() = inviter_id);

-- RLS Policies for group_join_requests
CREATE POLICY "Users can view their own requests or requests for groups they admin" ON public.group_join_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_join_requests.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Users can request to join public groups" ON public.group_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_join_requests.group_id AND is_public = true)
  );

CREATE POLICY "Group admins can update join requests" ON public.group_join_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_join_requests.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Users can cancel their own requests" ON public.group_join_requests
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_monthly_rankings
CREATE POLICY "Users can view rankings for their groups" ON public.group_monthly_rankings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_monthly_rankings.group_id AND user_id = auth.uid())
  );

CREATE POLICY "System can insert rankings" ON public.group_monthly_rankings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update rankings" ON public.group_monthly_rankings
  FOR UPDATE USING (true);

-- RLS Policies for group_activities
CREATE POLICY "Users can view activities in their groups" ON public.group_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_activities.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create activities in their groups" ON public.group_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_activities.group_id AND user_id = auth.uid())
  );

-- RLS Policies for group_invitation_notifications
CREATE POLICY "Users can view their own notifications" ON public.group_invitation_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.group_invitation_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.group_invitation_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to create notification when invitation is sent
CREATE OR REPLACE FUNCTION public.create_group_invitation_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_invitation_notifications (invitation_id, user_id)
  VALUES (NEW.id, NEW.invitee_id);
  RETURN NEW;
END;
$$;

-- Create trigger for group invitation notifications
CREATE TRIGGER on_group_invitation_created
  AFTER INSERT ON public.group_invitations
  FOR EACH ROW EXECUTE FUNCTION public.create_group_invitation_notification();

-- Create indexes for performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_invitations_invitee_id ON public.group_invitations(invitee_id);
CREATE INDEX idx_group_monthly_rankings_group_month ON public.group_monthly_rankings(group_id, month_date);
CREATE INDEX idx_groups_name ON public.groups(name);
CREATE INDEX idx_groups_is_public ON public.groups(is_public);
