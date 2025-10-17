-- Create user_streak_reminders table to store streak notification times
CREATE TABLE IF NOT EXISTS public.user_streak_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour integer NOT NULL CHECK (hour >= 0 AND hour <= 23),
  minute integer NOT NULL CHECK (minute >= 0 AND minute <= 59),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streak_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reminders" 
ON public.user_streak_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" 
ON public.user_streak_reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.user_streak_reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.user_streak_reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_streak_reminders_updated_at
BEFORE UPDATE ON public.user_streak_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing users' streak reminders from localStorage defaults to database
-- This creates a 6 PM reminder for all existing users who don't have one yet
INSERT INTO public.user_streak_reminders (user_id, hour, minute, enabled)
SELECT id, 18, 0, true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_streak_reminders WHERE user_id = auth.users.id
);