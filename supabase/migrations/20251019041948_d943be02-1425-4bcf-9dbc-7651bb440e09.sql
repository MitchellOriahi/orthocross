-- Create activity_reactions table for emoji reactions
CREATE TABLE public.activity_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.friend_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
ON public.activity_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their reactions"
ON public.activity_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Users can view reactions on activities they can see
CREATE POLICY "Users can view reactions on visible activities"
ON public.activity_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friend_activities fa
    WHERE fa.id = activity_reactions.activity_id
    AND (
      fa.user_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.friends f
        WHERE (f.user_id = auth.uid() AND f.friend_id = fa.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = fa.user_id)
      )
    )
  )
);

-- Create monthly_podium_views table to track if user has seen current month's podium
CREATE TABLE public.monthly_podium_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_date TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_date)
);

-- Enable RLS
ALTER TABLE public.monthly_podium_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can mark podium as viewed"
ON public.monthly_podium_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own records
CREATE POLICY "Users can view their own podium views"
ON public.monthly_podium_views
FOR SELECT
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_activity_reactions_activity_id ON public.activity_reactions(activity_id);
CREATE INDEX idx_monthly_podium_views_user_month ON public.monthly_podium_views(user_id, month_date);