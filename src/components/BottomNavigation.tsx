import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Flame, Book, Church, ScrollText, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  // Reading-style behavior: slide away on scroll down, return on scroll up
  hideOnScroll?: boolean;
}

export const BottomNavigation = ({ hideOnScroll = false }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideOnScroll) return;

    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) {
        setHidden(false);
        lastY = y;
        return;
      }
      const delta = y - lastY;
      // Small movements accumulate until they cross the threshold
      if (delta > 6) {
        setHidden(true);
        lastY = y;
      } else if (delta < -6) {
        setHidden(false);
        lastY = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScroll]);

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

  const prefetchFor = (path: string) => {
    if (path === "/dashboard") prefetchDashboardData();
    if (path === "/friends") {
      prefetchFriendsData();
      prefetchProfileData();
    }
    if (path === "/settings") prefetchProfileData();
  };

  return (
    <nav
      className={cn(
        "fixed left-3 right-3 z-50 transition-all duration-300 ease-out motion-reduce:transition-none",
        hidden ? "opacity-0 translate-y-8 pointer-events-none" : "opacity-100 translate-y-0"
      )}
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0.625rem)' }}
    >
      <div className="mx-auto max-w-md rounded-[1.75rem] bg-card/90 backdrop-blur-xl border border-border/70 shadow-elevated px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => prefetchFor(item.path)}
                onFocus={() => prefetchFor(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-[1.25rem] transition-colors min-h-[52px]",
                  isActive
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("h-[22px] w-[22px]", isActive && "fill-primary/20")} />
                <span className={cn("text-[11px] leading-none", isActive && "font-semibold")}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};