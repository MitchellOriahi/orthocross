import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import orthodoxCross from '@/assets/orthodox-cross.jpg';
import orthodoxCrossBlack from '@/assets/orthodox-cross-black-new.png';
import orthodoxCrossWhite from '@/assets/orthodox-cross-white-new.png';

interface AppLoaderProps {
  children: ReactNode;
  onAuthReady: (isAuthenticated: boolean, userId: string | null) => void;
}

// Module-level flag so the splash only ever runs once per session,
// even if AppLoader is unmounted/remounted by an ancestor re-render.
let hasInitialized = false;
let cachedAuth: { isAuthenticated: boolean; userId: string | null } | null = null;

export const AppLoader = ({ children, onAuthReady }: AppLoaderProps) => {
  const [isLoading, setIsLoading] = useState(!hasInitialized);
  const [fadeOut, setFadeOut] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    // If we already initialized once, just replay the auth callback synchronously
    // and skip the splash entirely.
    if (hasInitialized) {
      if (cachedAuth) {
        onAuthReady(cachedAuth.isAuthenticated, cachedAuth.userId);
      }
      return () => {
        mounted = false;
      };
    }

    const initializeApp = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated - preload critical data in parallel
          const userId = session.user.id;
          
          // First batch: user's own data
          const [streakResult, profileResult, readingResult] = await Promise.all([
            // Preload streak data
            supabase
              .from('user_streaks')
              .select('current_streak, longest_streak')
              .eq('user_id', userId)
              .maybeSingle(),
            // Preload profile data
            supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle(),
            // Preload last reading
            supabase
              .from('reading_progress')
              .select('*')
              .eq('user_id', userId)
              .order('last_read_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          // Cache profile data in React Query
          if (profileResult.data) {
            queryClient.setQueryData(['profile', userId], profileResult.data);
          }

          // Second batch: friends + groups + history + completed-chapters (parallel)
          const [
            friendsResult,
            membershipsResult,
            groupInvitationsResult,
            groupInvCountResult,
            pinnedGroupsResult,
            historyProgressResult,
            completedChaptersCountResult,
          ] = await Promise.all([
            supabase
              .from('friends')
              .select('friend_id')
              .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
            supabase
              .from('group_members')
              .select('group_id, role')
              .eq('user_id', userId),
            supabase
              .from('group_invitations')
              .select('*')
              .eq('invitee_id', userId)
              .eq('status', 'pending'),
            supabase
              .from('group_invitation_notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('read', false),
            supabase
              .from('pinned_groups')
              .select('group_id')
              .eq('user_id', userId),
            supabase
              .from('orthodox_history_progress')
              .select('*')
              .eq('user_id', userId),
            supabase
              .from('completed_chapters')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId),
          ]);

          // Seed group invitation count cache
          queryClient.setQueryData(['groupInvitationCount', userId], groupInvCountResult.count || 0);
          queryClient.setQueryData(['groupInvitations', userId], (groupInvitationsResult.data || []).map((inv: any) => ({
            id: inv.id,
            group_id: inv.group_id,
            group_name: 'Unknown Group',
            inviter_id: inv.inviter_id,
            inviter_username: 'Unknown',
            inviter_profile_picture_url: null,
            status: inv.status,
            created_at: inv.created_at,
          })));

          // Cache pinned groups for instant GroupsList render
          try {
            const pinnedIds = (pinnedGroupsResult.data || []).map((p: any) => p.group_id);
            sessionStorage.setItem(`pinned_groups_${userId}`, JSON.stringify(pinnedIds));
          } catch {}

          // Cache history progress for instant OrthodoxHistory render
          try {
            const historyProgress = (historyProgressResult.data || []).map((item: any) => ({
              campaignId: item.campaign_id,
              islandId: item.island_id,
              completed: item.completed,
              xpEarned: item.xp_earned,
            }));
            sessionStorage.setItem(`history_progress_${userId}`, JSON.stringify(historyProgress));
          } catch {}

          // Cache hasAnyProgress flag for Dashboard board progress bar
          try {
            sessionStorage.setItem('cached_has_any_progress', String((completedChaptersCountResult.count ?? 0) > 0));
          } catch {}

          // Resolve full user groups (with member counts) and seed React Query cache
          if (membershipsResult.data && membershipsResult.data.length > 0) {
            const groupIds = membershipsResult.data.map((m: any) => m.group_id);
            const { data: groupsRows } = await supabase
              .from('groups')
              .select('*')
              .in('id', groupIds);

            if (groupsRows) {
              const groupsWithCounts = await Promise.all(
                groupsRows.map(async (group: any) => {
                  const { count } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id);
                  const membership = membershipsResult.data!.find((m: any) => m.group_id === group.id);
                  return {
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    is_public: group.is_public,
                    created_by: group.created_by,
                    created_at: group.created_at,
                    member_count: count || 0,
                    user_role: membership?.role as 'owner' | 'admin' | 'member',
                  };
                })
              );
              queryClient.setQueryData(['userGroups', userId], groupsWithCounts);
            }
          } else {
            queryClient.setQueryData(['userGroups', userId], []);
          }

          // Always preload church cross images (not just when user has friends)
          const crossImagePromises = [orthodoxCross, orthodoxCrossBlack, orthodoxCrossWhite].map(src =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = src;
            })
          );

          if (friendsResult.data && friendsResult.data.length > 0) {
            // Extract unique friend IDs
            const friendIds = [...new Set(
              friendsResult.data.map(f =>
                f.friend_id === userId ? null : f.friend_id
              ).filter(Boolean)
            )] as string[];

            const reverseResult = await supabase
              .from('friends')
              .select('user_id')
              .eq('friend_id', userId);

            if (reverseResult.data) {
              reverseResult.data.forEach(f => {
                if (!friendIds.includes(f.user_id)) {
                  friendIds.push(f.user_id);
                }
              });
            }

            if (friendIds.length > 0) {
              const [friendProfilesResult, friendStreaksResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('id, username, profile_picture_url, streak_visible')
                  .in('id', friendIds),
                supabase
                  .from('user_streaks')
                  .select('user_id, current_streak')
                  .in('user_id', friendIds),
              ]);

              if (friendProfilesResult.data) {
                const imagePromises = friendProfilesResult.data
                  .filter(p => p.profile_picture_url)
                  .map(p => new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    img.src = p.profile_picture_url!;
                  }));

                if (profileResult.data?.profile_picture_url) {
                  imagePromises.push(new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    img.src = profileResult.data.profile_picture_url!;
                  }));
                }

                await Promise.race([
                  Promise.all([...imagePromises, ...crossImagePromises]),
                  new Promise(resolve => setTimeout(resolve, 2000)),
                ]);
              }

              if (friendProfilesResult.data) {
                const friendsData = friendProfilesResult.data.map(profile => {
                  const streak = friendStreaksResult.data?.find(s => s.user_id === profile.id);
                  return {
                    id: profile.id,
                    username: profile.username,
                    profile_picture_url: profile.profile_picture_url,
                    current_streak: streak?.current_streak || 0,
                    streak_visible: profile.streak_visible,
                  };
                });
                queryClient.setQueryData(['friends', userId], friendsData);
              }
            }
          } else {
            // No friends — still wait briefly for cross images
            await Promise.race([
              Promise.all(crossImagePromises),
              new Promise(resolve => setTimeout(resolve, 1500)),
            ]);
          }

          cachedAuth = { isAuthenticated: true, userId };
          if (mounted) {
            onAuthReady(true, userId);
          }
        } else {
          // Not authenticated - just a brief delay for smooth UX
          await new Promise(resolve => setTimeout(resolve, 500));
          cachedAuth = { isAuthenticated: false, userId: null };
          if (mounted) {
            onAuthReady(false, null);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        cachedAuth = { isAuthenticated: false, userId: null };
        if (mounted) {
          onAuthReady(false, null);
        }
      }

      hasInitialized = true;


      // Start fade out animation
      if (mounted) {
        setFadeOut(true);
        // Wait for fade animation then hide loader
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 300);
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, [onAuthReady, queryClient]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Splash Screen */}
      <div 
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="w-24 h-24 bg-foreground dark:bg-card rounded-3xl shadow-lg p-3 animate-pulse">
            <img 
              src={orthodoxCross} 
              alt="OrthoCross" 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* App Name */}
          <h1 className="text-2xl font-bold text-foreground">OrthoCross</h1>
          
          {/* Loading indicator */}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
      
      {/* Render children behind splash for preloading */}
      <div className="opacity-0 pointer-events-none">
        {children}
      </div>
    </>
  );
};