import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';

// OneSignal Capacitor plugin types
declare const OneSignal: {
  initialize: (appId: string) => void;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Notifications: {
    requestPermission: (fallbackToSettings: boolean) => Promise<boolean>;
    hasPermission: () => boolean;
  };
} | undefined;

interface OneSignalDebugState {
  initialized: boolean;
  currentUserId: string | null;
  loginCalled: boolean;
  loginSuccess: boolean;
  permissionGranted: boolean;
  retryCount: number;
}

// Retry delays in milliseconds: 0s, 2s, 5s
const RETRY_DELAYS = [0, 2000, 5000];

/**
 * Hook to initialize OneSignal and link the authenticated Supabase user.
 * Uses the OneSignal Capacitor/Cordova plugin (NOT web SDK).
 * 
 * Flow:
 * 1. Initialize OneSignal once on app startup
 * 2. Wait for auth to finish loading (session restore or login)
 * 3. Wait for notification permission to be resolved
 * 4. Call OneSignal.login(user.id) with retry logic (0s, 2s, 5s)
 * 5. On logout, call OneSignal.logout()
 */
export const useOneSignalUserLink = () => {
  const { user, loading } = useAuth();
  const linkedUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const loginAttemptRef = useRef(false);
  const retryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  const [debugState, setDebugState] = useState<OneSignalDebugState>({
    initialized: false,
    currentUserId: null,
    loginCalled: false,
    loginSuccess: false,
    permissionGranted: false,
    retryCount: 0,
  });

  // Clear any pending retry timeouts
  const clearRetryTimeouts = useCallback(() => {
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current = [];
  }, []);

  // Initialize OneSignal once on app startup
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      if (typeof OneSignal !== 'undefined') {
        console.log('[OneSignal] Initializing with app ID:', ONESIGNAL_APP_ID);
        OneSignal.initialize(ONESIGNAL_APP_ID);
        initializedRef.current = true;
        console.log('[OneSignal] ✓ Initialization successful');
        setDebugState(prev => ({ ...prev, initialized: true }));
      } else {
        console.log('[OneSignal] SDK not available (running in browser?)');
      }
    } catch (error) {
      console.error('[OneSignal] ✗ Initialization error:', error);
    }
  }, []);

  // Attempt to login with retry logic
  const attemptLogin = useCallback(async (userId: string, retryIndex: number = 0): Promise<boolean> => {
    if (typeof OneSignal === 'undefined') return false;
    
    console.log(`[OneSignal] Login attempt ${retryIndex + 1}/${RETRY_DELAYS.length} for user:`, userId);
    setDebugState(prev => ({ ...prev, loginCalled: true, retryCount: retryIndex }));
    
    try {
      await OneSignal.login(userId);
      linkedUserIdRef.current = userId;
      console.log('[OneSignal] ✓ Login successful for user:', userId);
      setDebugState(prev => ({ 
        ...prev, 
        currentUserId: userId,
        loginSuccess: true,
        retryCount: retryIndex,
      }));
      return true;
    } catch (error) {
      console.error(`[OneSignal] ✗ Login attempt ${retryIndex + 1} failed:`, error);
      
      // Schedule retry if we haven't exhausted all attempts
      if (retryIndex < RETRY_DELAYS.length - 1) {
        const nextDelay = RETRY_DELAYS[retryIndex + 1];
        console.log(`[OneSignal] Scheduling retry in ${nextDelay}ms...`);
        
        const timeout = setTimeout(() => {
          attemptLogin(userId, retryIndex + 1);
        }, nextDelay);
        
        retryTimeoutsRef.current.push(timeout);
      } else {
        console.error('[OneSignal] ✗ All login attempts exhausted');
        setDebugState(prev => ({ ...prev, loginSuccess: false }));
      }
      return false;
    }
  }, []);

  // Handle login/logout based on auth state
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      console.log('[OneSignal] Waiting for auth to load...');
      return;
    }

    const handleAuthChange = async () => {
      // OneSignal not available (web browser)
      if (typeof OneSignal === 'undefined') {
        console.log('[OneSignal] SDK not available, skipping auth handling');
        setDebugState(prev => ({ 
          ...prev, 
          currentUserId: user?.id || null,
          loginCalled: false,
          loginSuccess: false,
        }));
        return;
      }

      // User logged in (session restored or fresh login)
      if (user?.id) {
        console.log('[OneSignal] User authenticated:', user.id);
        
        // Skip if already linked for this user
        if (linkedUserIdRef.current === user.id) {
          console.log('[OneSignal] Already linked for user:', user.id);
          return;
        }

        // Prevent duplicate login attempts
        if (loginAttemptRef.current) {
          console.log('[OneSignal] Login already in progress, skipping');
          return;
        }
        
        loginAttemptRef.current = true;
        clearRetryTimeouts();

        try {
          // Check current permission state
          let hasPermission = false;
          try {
            hasPermission = OneSignal.Notifications.hasPermission();
            console.log('[OneSignal] Current permission state:', hasPermission);
            setDebugState(prev => ({ ...prev, permissionGranted: hasPermission }));
          } catch (e) {
            console.log('[OneSignal] Could not check permission state');
          }

          // Request permission if not granted
          if (!hasPermission) {
            console.log('[OneSignal] Requesting notification permission...');
            try {
              const granted = await OneSignal.Notifications.requestPermission(true);
              console.log('[OneSignal] Permission request result:', granted);
              setDebugState(prev => ({ ...prev, permissionGranted: granted }));
              hasPermission = granted;
            } catch (permError) {
              console.log('[OneSignal] Permission request error (may already be decided):', permError);
              // Re-check permission after error
              try {
                hasPermission = OneSignal.Notifications.hasPermission();
                console.log('[OneSignal] Permission state after error:', hasPermission);
                setDebugState(prev => ({ ...prev, permissionGranted: hasPermission }));
              } catch {
                // Ignore
              }
            }
          }

          // Proceed with login regardless of permission state
          // (External ID can be set even without push permission)
          console.log('[OneSignal] Proceeding with login, permission:', hasPermission);
          await attemptLogin(user.id, 0);
          
        } catch (error) {
          console.error('[OneSignal] ✗ Auth handling error:', error);
        } finally {
          loginAttemptRef.current = false;
        }
      } 
      // User logged out
      else if (linkedUserIdRef.current !== null) {
        console.log('[OneSignal] User logged out, clearing External ID...');
        clearRetryTimeouts();
        loginAttemptRef.current = false;
        
        try {
          await OneSignal.logout();
          linkedUserIdRef.current = null;
          console.log('[OneSignal] ✓ Logout successful');
          setDebugState(prev => ({ 
            ...prev, 
            currentUserId: null,
            loginCalled: false,
            loginSuccess: false,
            retryCount: 0,
          }));
        } catch (error) {
          console.error('[OneSignal] ✗ Logout error:', error);
        }
      }
    };

    handleAuthChange();
  }, [user?.id, loading, attemptLogin, clearRetryTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRetryTimeouts();
    };
  }, [clearRetryTimeouts]);

  return debugState;
};
