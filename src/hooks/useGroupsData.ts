import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
  user_role: 'owner' | 'admin' | 'member';
}

export interface GroupMember {
  id: string;
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  total_points: number;
  rank: number | null;
  consecutive_rank_count: number;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  group_name: string;
  inviter_id: string;
  inviter_username: string;
  inviter_profile_picture_url: string | null;
  status: string;
  created_at: string;
}

export interface GroupActivity {
  id: string;
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  activity_type: string;
  activity_data: Record<string, any>;
  created_at: string;
}

export interface GroupJoinRequest {
  id: string;
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  status: string;
  created_at: string;
}

const loadUserGroups = async (userId: string): Promise<Group[]> => {
  const { data: memberships, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', userId);

  if (membershipError || !memberships?.length) return [];

  const groupIds = memberships.map(m => m.group_id);
  
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  if (groupsError || !groups) return [];

  // Get member counts for each group
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      const membership = memberships.find(m => m.group_id === group.id);
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        is_public: group.is_public,
        created_by: group.created_by,
        created_at: group.created_at,
        member_count: count || 0,
        user_role: membership?.role as 'owner' | 'admin' | 'member'
      };
    })
  );

  return groupsWithCounts;
};

const loadGroupMembers = async (groupId: string, monthDate: string): Promise<GroupMember[]> => {
  const { data: members, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId);

  if (error || !members?.length) return [];

  const userIds = members.map(m => m.user_id);
  
  // Get profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', userIds);

  // Get rankings for this month
  const { data: rankings } = await supabase
    .from('group_monthly_rankings')
    .select('*')
    .eq('group_id', groupId)
    .eq('month_date', monthDate)
    .in('user_id', userIds)
    .order('total_points', { ascending: false });

  // Also get the global leaderboard points for members
  const { data: globalPoints } = await supabase
    .from('monthly_leaderboard')
    .select('user_id, total_points')
    .eq('month_date', monthDate)
    .in('user_id', userIds);

  return members.map((member, index) => {
    const profile = profiles?.find(p => p.id === member.user_id);
    const ranking = rankings?.find(r => r.user_id === member.user_id);
    const global = globalPoints?.find(g => g.user_id === member.user_id);
    
    // Calculate rank based on total_points
    let rank: number | null = null;
    if (rankings && rankings.length > 0) {
      const sortedRankings = [...rankings].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      const memberRankIndex = sortedRankings.findIndex(r => r.user_id === member.user_id);
      if (memberRankIndex !== -1) {
        rank = memberRankIndex + 1;
      }
    }

    return {
      id: member.id,
      user_id: member.user_id,
      username: profile?.username || 'Unknown',
      profile_picture_url: profile?.profile_picture_url || null,
      role: member.role as 'owner' | 'admin' | 'member',
      joined_at: member.joined_at,
      total_points: global?.total_points || ranking?.total_points || 0,
      rank,
      consecutive_rank_count: ranking?.consecutive_rank_count || 1
    };
  }).sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
};

const loadGroupInvitations = async (userId: string): Promise<GroupInvitation[]> => {
  const { data: invitations, error } = await supabase
    .from('group_invitations')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending');

  if (error || !invitations?.length) return [];

  const groupIds = invitations.map(i => i.group_id);
  const inviterIds = invitations.map(i => i.inviter_id);

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .in('id', groupIds);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', inviterIds);

  return invitations.map(inv => {
    const group = groups?.find(g => g.id === inv.group_id);
    const inviter = profiles?.find(p => p.id === inv.inviter_id);
    
    return {
      id: inv.id,
      group_id: inv.group_id,
      group_name: group?.name || 'Unknown Group',
      inviter_id: inv.inviter_id,
      inviter_username: inviter?.username || 'Unknown',
      inviter_profile_picture_url: inviter?.profile_picture_url || null,
      status: inv.status,
      created_at: inv.created_at
    };
  });
};

const loadGroupActivities = async (groupId: string): Promise<GroupActivity[]> => {
  const { data: activities, error } = await supabase
    .from('group_activities')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !activities?.length) return [];

  const userIds = [...new Set(activities.map(a => a.user_id))];
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', userIds);

  return activities.map(activity => {
    const profile = profiles?.find(p => p.id === activity.user_id);
    return {
      id: activity.id,
      user_id: activity.user_id,
      username: profile?.username || 'Unknown',
      profile_picture_url: profile?.profile_picture_url || null,
      activity_type: activity.activity_type,
      activity_data: activity.activity_data as Record<string, any>,
      created_at: activity.created_at
    };
  });
};

const loadGroupJoinRequests = async (groupId: string): Promise<GroupJoinRequest[]> => {
  const { data: requests, error } = await supabase
    .from('group_join_requests')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending');

  if (error || !requests?.length) return [];

  const userIds = requests.map(r => r.user_id);
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', userIds);

  return requests.map(req => ({
    id: req.id,
    user_id: req.user_id,
    username: profiles?.find(p => p.id === req.user_id)?.username || 'Unknown',
    profile_picture_url: profiles?.find(p => p.id === req.user_id)?.profile_picture_url || null,
    status: req.status,
    created_at: req.created_at
  }));
};

const loadUnreadInvitationCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('group_invitation_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  return count || 0;
};

export const useGroupsData = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['userGroups', userId],
    queryFn: () => loadUserGroups(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60
  });

  const { data: invitations = [], isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery({
    queryKey: ['groupInvitations', userId],
    queryFn: () => loadGroupInvitations(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60
  });

  const { data: unreadInvitationCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['groupInvitationCount', userId],
    queryFn: () => loadUnreadInvitationCount(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30
  });

  return {
    groups,
    invitations,
    unreadInvitationCount,
    isLoading: groupsLoading || invitationsLoading,
    refetch: {
      groups: refetchGroups,
      invitations: refetchInvitations,
      unreadCount: refetchUnreadCount
    }
  };
};

export const useGroupDetail = (groupId: string | undefined, userId: string | undefined) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['groupMembers', groupId, currentMonth],
    queryFn: () => loadGroupMembers(groupId!, currentMonth),
    enabled: !!groupId && !!userId,
    staleTime: 1000 * 30
  });

  const { data: activities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['groupActivities', groupId],
    queryFn: () => loadGroupActivities(groupId!),
    enabled: !!groupId && !!userId,
    staleTime: 1000 * 30
  });

  const { data: joinRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['groupJoinRequests', groupId],
    queryFn: () => loadGroupJoinRequests(groupId!),
    enabled: !!groupId && !!userId,
    staleTime: 1000 * 30
  });

  return {
    members,
    activities,
    joinRequests,
    isLoading: membersLoading || activitiesLoading || requestsLoading,
    refetch: {
      members: refetchMembers,
      activities: refetchActivities,
      requests: refetchRequests
    }
  };
};

export const searchPublicGroups = async (searchTerm: string): Promise<Group[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .eq('is_public', true)
    .ilike('name', `%${searchTerm}%`)
    .limit(20);

  if (error || !groups) return [];

  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        is_public: group.is_public,
        created_by: group.created_by,
        created_at: group.created_at,
        member_count: count || 0,
        user_role: 'member' as const
      };
    })
  );

  return groupsWithCounts;
};
