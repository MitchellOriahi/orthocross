-- Enable realtime for friend-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_streaks;