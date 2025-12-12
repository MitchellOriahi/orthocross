import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import orthodoxCross from '@/assets/orthodox-cross.jpg';

interface AppLoaderProps {
  children: ReactNode;
  onAuthReady: (isAuthenticated: boolean, userId: string | null) => void;
}

export const AppLoader = ({ children, onAuthReady }: AppLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated - preload critical data in parallel
          const userId = session.user.id;
          
          await Promise.all([
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
            // Small delay to ensure smooth transition
            new Promise(resolve => setTimeout(resolve, 800))
          ]);

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
  }, [onAuthReady]);

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
