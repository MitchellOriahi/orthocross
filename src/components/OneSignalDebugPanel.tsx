import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';

/**
 * Dev-only debug panel showing OneSignal integration state.
 * Remove this component once External User ID appears in OneSignal dashboard.
 */
export const OneSignalDebugPanel = () => {
  const { user, loading } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [loginCalled, setLoginCalled] = useState(false);
  const [loginUserId, setLoginUserId] = useState<string | null>(null);
  const [loginTypeOf, setLoginTypeOf] = useState<string>('unknown');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forcing, setForcing] = useState(false);

  useEffect(() => {
    // Check if OneSignal is initialized
    const checkInit = () => {
      if (window.OneSignal) {
        setInitialized(true);
        setLoginTypeOf(typeof window.OneSignal?.login);
      }
    };
    
    // Check periodically
    const interval = setInterval(checkInit, 500);
    checkInit();
    
    return () => clearInterval(interval);
  }, []);

  // Listen for login events via custom event
  useEffect(() => {
    const handleLogin = (e: CustomEvent) => {
      setLoginCalled(true);
      setLoginUserId(e.detail?.userId || 'unknown');
    };
    
    window.addEventListener('onesignal-login-called', handleLogin as EventListener);
    return () => window.removeEventListener('onesignal-login-called', handleLogin as EventListener);
  }, []);

  const handleForceLogin = async () => {
    if (!user?.id) {
      setLoginError('No user.id available');
      return;
    }
    if (!window.OneSignal?.login) {
      setLoginError('OneSignal.login is not available');
      return;
    }

    setForcing(true);
    setLoginError(null);

    try {
      // Wait for permission handling to ensure native bridge is ready
      console.log('[OneSignal Debug] Waiting for permission handling...');
      if (window.OneSignal?.Notifications?.requestPermission) {
        await window.OneSignal.Notifications.requestPermission(false);
        console.log('[OneSignal Debug] Permission handling complete');
      }
      
      console.log('[OneSignal Debug] Force calling login with:', user.id);
      await window.OneSignal.login(user.id);
      console.log('[OneSignal Debug] Force login succeeded');
      setLoginCalled(true);
      setLoginUserId(user.id);
      window.dispatchEvent(
        new CustomEvent('onesignal-login-called', { detail: { userId: user.id } })
      );
    } catch (err: any) {
      console.error('[OneSignal Debug] Force login failed:', err);
      setLoginError(err?.message || String(err));
    } finally {
      setForcing(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-xs shadow-lg border border-yellow-500">
      <div className="font-bold text-yellow-400 mb-2">🔧 OneSignal Debug</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">App ID:</span>{' '}
          <span className="text-green-400">{ONESIGNAL_APP_ID.slice(0, 8)}...</span>
        </div>
        <div>
          <span className="text-gray-400">Auth Loading:</span>{' '}
          <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
            {loading ? 'true ⏳' : 'false ✓'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">User ID:</span>{' '}
          <span className={user?.id ? 'text-green-400' : 'text-red-400'}>
            {user?.id ? `${user.id.slice(0, 8)}...` : 'null ❌'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">SDK Init:</span>{' '}
          <span className={initialized ? 'text-green-400' : 'text-red-400'}>
            {initialized ? 'true ✓' : 'false ❌'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">typeof login:</span>{' '}
          <span className="text-blue-400">{loginTypeOf}</span>
        </div>
        <div>
          <span className="text-gray-400">Login Called:</span>{' '}
          <span className={loginCalled ? 'text-green-400' : 'text-red-400'}>
            {loginCalled ? 'true ✓' : 'false ❌'}
          </span>
        </div>
        {loginUserId && (
          <div>
            <span className="text-gray-400">Login User:</span>{' '}
            <span className="text-blue-400">{loginUserId.slice(0, 8)}...</span>
          </div>
        )}
        {loginError && (
          <div className="text-red-400 mt-1 break-words">
            <span className="text-gray-400">Error:</span> {loginError}
          </div>
        )}
        <button
          onClick={handleForceLogin}
          disabled={forcing || !initialized || !user?.id}
          className="mt-2 w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-1 px-2 rounded"
        >
          {forcing ? 'Forcing...' : 'Force OneSignal Login'}
        </button>
      </div>
    </div>
  );
};
