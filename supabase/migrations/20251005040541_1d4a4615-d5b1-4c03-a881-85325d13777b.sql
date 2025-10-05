-- Create table for user Orthodox History progress
CREATE TABLE IF NOT EXISTS public.orthodox_history_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,
  island_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, island_id)
);

-- Create table for user avatar customization
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  gender TEXT NOT NULL DEFAULT 'male',
  skin_tone TEXT NOT NULL DEFAULT 'medium',
  hairstyle TEXT NOT NULL DEFAULT 'short_cropped',
  eye_color TEXT NOT NULL DEFAULT 'brown',
  beard_option TEXT NOT NULL DEFAULT 'none',
  outfit_palette TEXT NOT NULL DEFAULT 'earth',
  equipped_armor JSONB NOT NULL DEFAULT '[]',
  total_xp INTEGER NOT NULL DEFAULT 0,
  hearts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orthodox_history_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Create policies for orthodox_history_progress
CREATE POLICY "Users can view their own progress"
ON public.orthodox_history_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.orthodox_history_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.orthodox_history_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policies for user_avatars
CREATE POLICY "Users can view their own avatar"
ON public.user_avatars
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatar"
ON public.user_avatars
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar"
ON public.user_avatars
FOR UPDATE
USING (auth.uid() = user_id);

-- Create triggers for timestamps
CREATE TRIGGER update_orthodox_history_progress_updated_at
BEFORE UPDATE ON public.orthodox_history_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_avatars_updated_at
BEFORE UPDATE ON public.user_avatars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();