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

export const AppLoader = ({ children, onAuthReady }: AppLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

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

          // Second batch: friends data (depends on user being authenticated)
          const [friendsResult] = await Promise.all([
            // Get friends list
            supabase
              .from('friends')
              .select('friend_id')
              .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
          ]);

          if (friendsResult.data && friendsResult.data.length > 0) {
            // Extract unique friend IDs
            const friendIds = [...new Set(
              friendsResult.data.map(f => 
                f.friend_id === userId ? null : f.friend_id
              ).filter(Boolean)
            )] as string[];

            // Also get friends where current user is the friend_id
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
              // Preload friends' profiles and streaks in parallel
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

              // Preload profile picture images
              if (friendProfilesResult.data) {
                const imagePromises = friendProfilesResult.data
                  .filter(p => p.profile_picture_url)
                  .map(p => {
                    return new Promise<void>((resolve) => {
                      const img = new Image();
                      img.onload = () => resolve();
                      img.onerror = () => resolve();
                      img.src = p.profile_picture_url!;
                    });
                  });

                // Also preload user's own profile picture
                if (profileResult.data?.profile_picture_url) {
                  imagePromises.push(
                    new Promise<void>((resolve) => {
                      const img = new Image();
                      img.onload = () => resolve();
                      img.onerror = () => resolve();
                      img.src = profileResult.data.profile_picture_url!;
                    })
                  );
                }

                // Also preload the church cross images
                const crossImages = [orthodoxCross, orthodoxCrossBlack, orthodoxCrossWhite];
                crossImages.forEach(src => {
                  imagePromises.push(
                    new Promise<void>((resolve) => {
                      const img = new Image();
                      img.onload = () => resolve();
                      img.onerror = () => resolve();
                      img.src = src;
                    })
                  );
                });

                // Wait for images to load (with timeout)
                await Promise.race([
                  Promise.all(imagePromises),
                  new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout for images
                ]);
              }

              // Cache friends data in React Query for useFriendsData hook
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
          }

          if (mounted) {
            onAuthReady(true, userId);
          }
        } else {
          // Not authenticated - just a brief delay for smooth UX
          await new Promise(resolve => setTimeout(resolve, 500));
          if (mounted) {
            onAuthReady(false, null);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        if (mounted) {
          onAuthReady(false, null);
        }
      }

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