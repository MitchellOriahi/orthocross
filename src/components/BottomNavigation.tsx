import { useNavigate, useLocation } from "react-router-dom";
import { Flame, Book, Church, ScrollText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchProfileData = async () => {
    if (!user) return;

    queryClient.prefetchQuery({
      queryKey: ['profile', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('profiles')
          .select('profile_picture_url, username, streak_visible, fasting_notifications_enabled, streak_notifications_enabled, friends_notifications_enabled, fasting_reminder_days, wednesday_notifications_enabled, display_name')
          .eq('id', user.id)
          .maybeSingle();

        return data;
      },
      staleTime: 30000,
    });
  };

  const prefetchDashboardData = async () => {
    if (!user) return;

    // Prefetch streak data
    queryClient.prefetchQuery({
      queryKey: ['streak', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak, last_completion_date, last_activity_date, guardian_angel_saves, guardian_angel_percentage')
          .eq('user_id', user.id)
          .maybeSingle();

        return data;
      },
      staleTime: 30000,
    });

    // Prefetch reading progress data
    queryClient.prefetchQuery({
      queryKey: ['lastReading', user.id],
      queryFn: async () => {
        const { data: lastCompleted } = await supabase
          .from('completed_chapters')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastCompleted) return null;

        const bookKey = lastCompleted.book_key;
        const lastChapter = lastCompleted.chapter;
        const nextChapter = lastChapter + 1;

        const { BIBLE_BOOKS } = await import('@/data/bibleContent');
        const bookInfo = BIBLE_BOOKS.find(b => b.title === bookKey);
        const totalChapters = bookInfo?.totalChapters || 1;

        const { data: completedInBook } = await supabase
          .from('completed_chapters')
          .select('chapter')
          .eq('user_id', user.id)
          .eq('book_key', bookKey);

        const { data: chapterProgress } = await supabase
          .from('reading_progress')
          .select('progress')
          .eq('user_id', user.id)
          .eq('book_key', bookKey)
          .eq('current_chapter', nextChapter)
          .maybeSingle();

        return {
          lastCompleted,
          bookInfo,
          totalChapters,
          completedInBook,
          chapterProgress,
          nextChapter
        };
      },
      staleTime: 30000,
    });
  };

  const prefetchFriendsData = async () => {
    if (!user) return;
    
    // Import the actual query functions
    const loadFriendsData = async () => {
      const { data: friendsData } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendsData) {
        const friendIds = friendsData.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, profile_picture_url, streak_visible')
          .in('id', friendIds);

        const { data: streaksData } = await supabase
          .from('user_streaks')
          .select('user_id, current_streak')
          .in('user_id', friendIds);

        if (profilesData) {
          return profilesData.map(profile => ({
            ...profile,
            current_streak: streaksData?.find(s => s.user_id === profile.id)?.current_streak || 0
          }));
        }
      }
      return [];
    };

    const loadSentRequestsData = async () => {
      const { data: requestsData } = await supabase
        .from('friend_requests')
        .select('id, receiver_id, created_at')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsData && requestsData.length > 0) {
        const requestIds = requestsData.map(r => r.id);
        const { data: profilesData } = await supabase
          .rpc('get_friend_request_profiles', { request_ids: requestIds });

        return requestsData.map(request => {
          const profile = profilesData?.find(p => p.request_id === request.id);
          return {
            id: request.id,
            receiver_id: request.receiver_id,
            username: profile?.username || 'User',
            profile_picture_url: profile?.profile_picture_url || null,
            created_at: request.created_at
          };
        });
      }
      return [];
    };

    const loadReceivedRequestsData = async () => {
      const { data: requestsData } = await supabase
        .rpc('get_received_request_profiles');

      if (requestsData) {
        const requests = requestsData.map(req => ({
          id: req.request_id,
          sender_id: req.sender_id,
          username: req.username || 'User',
          profile_picture_url: req.profile_picture_url || null,
          created_at: req.created_at
        }));

        const { count } = await supabase
          .from('friend_request_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false);

        return { requests, unreadCount: count || 0 };
      }
      return { requests: [], unreadCount: 0 };
    };

    const loadActivitiesData = async () => {
      const { data: friendsData } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendsData) {
        const friendIds = friendsData.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: activitiesData } = await supabase
          .from('friend_activities')
          .select('id, user_id, activity_type, activity_data, created_at')
          .in('user_id', friendIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (activitiesData) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', activitiesData.map(a => a.user_id));

          const { data: reactionsData } = await supabase
            .from('activity_reactions')
            .select('activity_id, emoji, user_id')
            .in('activity_id', activitiesData.map(a => a.id));

          return activitiesData.map(activity => {
            const activityReactions = reactionsData?.filter(r => r.activity_id === activity.id) || [];
            const reactionCounts = new Map();
            
            activityReactions.forEach(reaction => {
              const current = reactionCounts.get(reaction.emoji) || { count: 0, userReacted: false };
              reactionCounts.set(reaction.emoji, {
                count: current.count + 1,
                userReacted: current.userReacted || reaction.user_id === user.id
              });
            });

            const reactions = Array.from(reactionCounts.entries()).map(([emoji, data]: [string, any]) => ({
              emoji,
              count: data.count,
              userReacted: data.userReacted
            }));

            return {
              ...activity,
              username: profilesData?.find(p => p.id === activity.user_id)?.username || 'Unknown User',
              reactions
            };
          });
        }
      }
      return [];
    };
    
    // Prefetch all Friends page queries
    queryClient.prefetchQuery({
      queryKey: ['friends', user.id],
      queryFn: loadFriendsData,
      staleTime: 30000,
    });
    queryClient.prefetchQuery({
      queryKey: ['sentRequests', user.id],
      queryFn: loadSentRequestsData,
      staleTime: 30000,
    });
    queryClient.prefetchQuery({
      queryKey: ['receivedRequests', user.id],
      queryFn: loadReceivedRequestsData,
      staleTime: 30000,
    });
    queryClient.prefetchQuery({
      queryKey: ['friendActivities', user.id],
      queryFn: loadActivitiesData,
      staleTime: 30000,
    });
  };

  const navItems = [
    {
      icon: ScrollText,
      path: "/orthodox-history",
      label: "History"
    },
    {
      icon: Book,
      path: "/index",
      label: "Scripture"
    },
    {
      icon: Flame,
      path: "/dashboard",
      label: "Board"
    },
    {
      icon: Church,
      path: "/church-resources",
      label: "Church"
    },
    {
      icon: Users,
      path: "/friends",
      label: "Friends"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                onMouseEnter={() => {
                  if (item.path === "/dashboard") {
                    prefetchDashboardData();
                  }
                  if (item.path === "/friends") {
                    prefetchFriendsData();
                    prefetchProfileData();
                  }
                  if (item.path === "/settings") {
                    prefetchProfileData();
                  }
                }}
                onFocus={() => {
                  if (item.path === "/dashboard") {
                    prefetchDashboardData();
                  }
                  if (item.path === "/friends") {
                    prefetchFriendsData();
                    prefetchProfileData();
                  }
                  if (item.path === "/settings") {
                    prefetchProfileData();
                  }
                }}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};