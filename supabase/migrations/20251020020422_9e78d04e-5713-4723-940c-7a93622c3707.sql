-- Add streak visibility setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_visible boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.streak_visible IS 'Controls whether the user''s streak is visible to friends';