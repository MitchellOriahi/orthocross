-- Create pinned_groups table for users to pin their favorite groups
CREATE TABLE public.pinned_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.pinned_groups ENABLE ROW LEVEL SECURITY;

-- Users can view their own pinned groups
CREATE POLICY "Users can view their own pinned groups"
ON public.pinned_groups
FOR SELECT
USING (auth.uid() = user_id);

-- Users can pin groups
CREATE POLICY "Users can pin groups"
ON public.pinned_groups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unpin groups
CREATE POLICY "Users can unpin groups"
ON public.pinned_groups
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_pinned_groups_user_id ON public.pinned_groups(user_id);