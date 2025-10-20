import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Friend {
  id: string;
  username: string;
  profile_picture_url: string | null;
  streak_visible: boolean;
  current_streak: number;
}

export interface FriendRequest {
  id: string;
  receiver_id: string;
  username: string;
  profile_picture_url: string | null;
  created_at: string;
}

export interface ReceivedRequest {
  id: string;
  sender_id: string;
  username: string;
  profile_picture_url: string | null;
  created_at: string;
}

export interface FriendActivity {
  id: string;
  username: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
}

const loadFriendsData = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data: friendsData } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (friendsData) {
    const friendIds = friendsData.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
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
      })) as Friend[];
    }
  }

  return [];
};

const loadSentRequestsData = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data: requestsData } = await supabase
    .from('friend_requests')
    .select('id, receiver_id, created_at')
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (requestsData && requestsData.length > 0) {
    const requestIds = requestsData.map(r => r.id);

    const { data: profilesData } = await supabase
      .rpc('get_friend_request_profiles', { request_ids: requestIds });

    const requestsWithProfiles = requestsData.map(request => {
      const profile = profilesData?.find(p => p.request_id === request.id);
      return {
        id: request.id,
        receiver_id: request.receiver_id,
        username: profile?.username || 'User',
        profile_picture_url: profile?.profile_picture_url || null,
        created_at: request.created_at
      };
    });

    return requestsWithProfiles;
  }

  return [];
};

const loadReceivedRequestsData = async (userId: string | undefined) => {
  if (!userId) return { requests: [], unreadCount: 0 };

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
      .eq('receiver_id', userId)
      .eq('read', false);

    return { requests, unreadCount: count || 0 };
  }

  return { requests: [], unreadCount: 0 };
};

const loadActivitiesData = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data: friendsData } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (friendsData) {
    const friendIds = friendsData.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
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

      const activitiesWithUsernames = activitiesData.map(activity => {
        const activityReactions = reactionsData?.filter(r => r.activity_id === activity.id) || [];
        const reactionCounts = new Map<string, { count: number; userReacted: boolean }>();
        
        activityReactions.forEach(reaction => {
          const current = reactionCounts.get(reaction.emoji) || { count: 0, userReacted: false };
          reactionCounts.set(reaction.emoji, {
            count: current.count + 1,
            userReacted: current.userReacted || reaction.user_id === userId
          });
        });

        const reactions = Array.from(reactionCounts.entries()).map(([emoji, data]) => ({
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

      return activitiesWithUsernames as FriendActivity[];
    }
  }

  return [];
};

export const useFriendsData = (userId: string | undefined) => {
  const friends = useQuery({
    queryKey: ['friends', userId],
    queryFn: () => loadFriendsData(userId),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  const sentRequests = useQuery({
    queryKey: ['sentRequests', userId],
    queryFn: () => loadSentRequestsData(userId),
    enabled: !!userId,
    staleTime: 30000,
  });

  const receivedRequests = useQuery({
    queryKey: ['receivedRequests', userId],
    queryFn: () => loadReceivedRequestsData(userId),
    enabled: !!userId,
    staleTime: 30000,
  });

  const activities = useQuery({
    queryKey: ['friendActivities', userId],
    queryFn: () => loadActivitiesData(userId),
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data for real-time updates
  });

  return {
    friends: friends.data || [],
    sentRequests: sentRequests.data || [],
    receivedRequests: receivedRequests.data?.requests || [],
    unreadNotificationCount: receivedRequests.data?.unreadCount || 0,
    activities: activities.data || [],
    isLoading: friends.isLoading || sentRequests.isLoading || receivedRequests.isLoading || activities.isLoading,
    refetch: {
      friends: friends.refetch,
      sentRequests: sentRequests.refetch,
      receivedRequests: receivedRequests.refetch,
      activities: activities.refetch,
    }
  };
};
