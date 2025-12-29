import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';

// OneSignal Capacitor plugin types
declare const OneSignal: {
  initialize: (appId: string) => void;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
} | undefined;

interface OneSignalDebugState {
  initialized: boolean;
  currentUserId: string | null;
  loginCalled: boolean;
}

/**
 * Hook to initialize OneSignal and link the authenticated Supabase user.
 * Uses the OneSignal Capacitor/Cordova plugin (NOT web SDK).
 */
export const useOneSignalUserLink = () => {
  const { user, loading } = useAuth();
  const linkedUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  
  const [debugState, setDebugState] = useState<OneSignalDebugState>({
    initialized: false,
    currentUserId: null,
    loginCalled: false,
  });

  // Initialize OneSignal once on app startup
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      if (typeof OneSignal !== 'undefined') {
        OneSignal.initialize(ONESIGNAL_APP_ID);
        initializedRef.current = true;
        console.log('[OneSignal] init ok');
        setDebugState(prev => ({ ...prev, initialized: true }));
      } else {
        console.log('[OneSignal] SDK not available (running in browser?)');
      }
    } catch (error) {
      console.error('[OneSignal] init error:', error);
    }
  }, []);

  // Handle login/logout based on auth state
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    const handleAuthChange = async () => {
      // OneSignal not available (web browser)
      if (typeof OneSignal === 'undefined') {
        setDebugState(prev => ({ 
          ...prev, 
          currentUserId: user?.id || null,
          loginCalled: false 
        }));
        return;
      }

      // User logged in
      if (user?.id) {
        // Skip if already linked for this user
        if (linkedUserIdRef.current === user.id) {
          console.log('[OneSignal] already logged in as', user.id);
          return;
        }

        try {
          await OneSignal.login(user.id);
          linkedUserIdRef.current = user.id;
          console.log('[OneSignal] login', user.id);
          setDebugState(prev => ({ 
            ...prev, 
            currentUserId: user.id,
            loginCalled: true 
          }));
        } catch (error) {
          console.error('[OneSignal] login error:', error);
        }
      } 
      // User logged out
      else if (linkedUserIdRef.current !== null) {
        try {
          await OneSignal.logout();
          linkedUserIdRef.current = null;
          console.log('[OneSignal] logout');
          setDebugState(prev => ({ 
            ...prev, 
            currentUserId: null,
            loginCalled: false 
          }));
        } catch (error) {
          console.error('[OneSignal] logout error:', error);
        }
      }
    };

    handleAuthChange();
  }, [user?.id, loading]);

  return debugState;
};
