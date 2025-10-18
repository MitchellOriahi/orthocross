-- Create missing tables and policies only

-- Add display_name to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create activity feed table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.friend_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('book_complete', 'saint_complete', 'history_achievement')),
  activity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly leaderboard if it doesn't exist
CREATE TABLE IF NOT EXISTS public.monthly_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_date TEXT NOT NULL,
  books_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_date)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_friends_user ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_activities_user ON public.friend_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboard_month ON public.monthly_leaderboard(month_date, books_completed DESC);

-- Enable RLS for new tables
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard ENABLE ROW LEVEL SECURITY;

-- Friends policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can view their own friends'
  ) THEN
    CREATE POLICY "Users can view their own friends" ON public.friends
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can delete their friendships'
  ) THEN
    CREATE POLICY "Users can delete their friendships" ON public.friends
      FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

-- Activity policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'friend_activities' AND policyname = 'Users can view activities of their friends'
  ) THEN
    CREATE POLICY "Users can view activities of their friends" ON public.friend_activities
      FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM public.friends 
          WHERE (user_id = auth.uid() AND friend_id = friend_activities.user_id)
             OR (friend_id = auth.uid() AND user_id = friend_activities.user_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'friend_activities' AND policyname = 'Users can create their own activities'
  ) THEN
    CREATE POLICY "Users can create their own activities" ON public.friend_activities
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Leaderboard policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_leaderboard' AND policyname = 'Users can view leaderboard'
  ) THEN
    CREATE POLICY "Users can view leaderboard" ON public.monthly_leaderboard
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.friends 
          WHERE (user_id = auth.uid() AND friend_id = monthly_leaderboard.user_id)
             OR (friend_id = auth.uid() AND user_id = monthly_leaderboard.user_id)
        ) OR user_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_leaderboard' AND policyname = 'Users can update their own leaderboard stats'
  ) THEN
    CREATE POLICY "Users can update their own leaderboard stats" ON public.monthly_leaderboard
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'monthly_leaderboard' AND policyname = 'Users can update their leaderboard stats'
  ) THEN
    CREATE POLICY "Users can update their leaderboard stats" ON public.monthly_leaderboard
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;