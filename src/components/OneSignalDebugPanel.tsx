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
  const [enabling, setEnabling] = useState(false);

  // Step-by-step debug state for force flow
  const [permStatusBefore, setPermStatusBefore] = useState<string>('unknown');
  const [afterRequestPermission, setAfterRequestPermission] = useState(false);
  const [loginResult, setLoginResult] = useState<string>('');
  
  // Current permission state (polled)
  const [currentPermission, setCurrentPermission] = useState<string>('unknown');

  useEffect(() => {
    // Check if OneSignal is initialized and poll permission state
    const checkInit = async () => {
      if (window.OneSignal) {
        setInitialized(true);
        setLoginTypeOf(typeof window.OneSignal?.login);
        
        // Poll current permission state
        try {
          const perm = (window.OneSignal?.Notifications as any)?.permission;
          const value = typeof perm === 'function' ? await perm() : await Promise.resolve(perm);
          setCurrentPermission(typeof value === 'string' ? value : JSON.stringify(value));
        } catch (e: any) {
          setCurrentPermission(`error: ${e?.message || String(e)}`);
        }
      }
    };
    
    // Check periodically
    const interval = setInterval(checkInit, 1000);
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

  const getOneSignal = (): Promise<any> => {
    return new Promise((resolve) => {
      if (window.OneSignal) return resolve(window.OneSignal);
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push((OneSignal) => resolve(OneSignal));
    });
  };

  const readPermissionStatus = async (OneSignal: any): Promise<string> => {
    try {
      const perm = OneSignal?.Notifications?.permission;
      // Some SDK builds expose permission as a value, others as a function/promise.
      const value = typeof perm === 'function' ? await perm() : await Promise.resolve(perm);
      return typeof value === 'string' ? value : JSON.stringify(value);
    } catch (e: any) {
      return `error: ${e?.message || String(e)}`;
    }
  };

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string
  ): Promise<{ ok: true; value: T } | { ok: false; reason: 'timeout' | 'error'; error?: string }> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs);
    });

    try {
      const value = await Promise.race([promise, timeoutPromise]);
      if (timeoutId) window.clearTimeout(timeoutId);
      return { ok: true as const, value: value as T };
    } catch (e: any) {
      if (timeoutId) window.clearTimeout(timeoutId);
      const msg = e?.message || String(e);
      if (String(msg).toLowerCase().includes('timeout')) {
        return { ok: false as const, reason: 'timeout' as const };
      }
      return {
        ok: false as const,
        reason: 'error' as const,
        error: msg,
      };
    }
  };

  const handleForceLogin = async () => {
    if (!user?.id) {
      setLoginError('No user.id available');
      return;
    }

    setForcing(true);
    setLoginError(null);
    setAfterRequestPermission(false);
    setLoginResult('');

    try {
      const OneSignal = await getOneSignal();
      setLoginTypeOf(typeof OneSignal?.login);

      // Permission status BEFORE
      const before = await readPermissionStatus(OneSignal);
      setPermStatusBefore(before);
      console.log('[OneSignal Debug] permStatusBefore:', before);

      if (typeof OneSignal?.Notifications?.requestPermission !== 'function') {
        throw new Error(
          `OneSignal.Notifications.requestPermission is not available (got ${typeof OneSignal?.Notifications?.requestPermission})`
        );
      }
      if (typeof OneSignal?.login !== 'function') {
        throw new Error(`OneSignal.login is not a function (got ${typeof OneSignal?.login})`);
      }

      // REQUIRED sequence: ensure permission handling is resolved BEFORE login
      console.log('[OneSignal Debug] Awaiting requestPermission(false)...');
      await OneSignal.Notifications.requestPermission(false);
      console.log('[OneSignal Debug] after requestPermission (resolved)');
      setAfterRequestPermission(true);

      console.log('[OneSignal Debug] Calling login with:', user.id);
      const loginAttempt = await withTimeout(
        Promise.resolve(OneSignal.login(user.id)),
        5000,
        'OneSignal.login'
      );

      if (loginAttempt.ok) {
        console.log('[OneSignal Debug] loginResult: success');
        setLoginResult('success');
        setLoginCalled(true);
        setLoginUserId(user.id);
        window.dispatchEvent(
          new CustomEvent('onesignal-login-called', { detail: { userId: user.id } })
        );
      } else {
        // ok === false => we have reason/error available
        const reason = (loginAttempt as any).reason as 'timeout' | 'error' | undefined;
        const errMsg = (loginAttempt as any).error as string | undefined;

        if (reason === 'timeout') {
          console.warn('[OneSignal Debug] loginResult: timeout');
          setLoginResult('timeout');
          setLoginCalled(false);
          setLoginError('login timeout');
        } else {
          console.error('[OneSignal Debug] loginResult: error:', errMsg);
          setLoginResult(`error: ${errMsg || 'unknown'}`);
          setLoginCalled(false);
          setLoginError(errMsg || 'Unknown login error');
        }
      }
    } catch (err: any) {
      console.error('[OneSignal Debug] Force login failed:', err);
      setLoginError(err?.message || String(err));
      setLoginCalled(false);
      setLoginResult(`error: ${err?.message || String(err)}`);
    } finally {
      setForcing(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!user?.id) {
      setLoginError('No user.id available');
      return;
    }

    setEnabling(true);
    setLoginError(null);
    setAfterRequestPermission(false);
    setLoginResult('');

    try {
      const OneSignal = await getOneSignal();
      setLoginTypeOf(typeof OneSignal?.login);

      // Permission status BEFORE
      const before = await readPermissionStatus(OneSignal);
      setPermStatusBefore(before);
      console.log('[OneSignal Debug] permStatusBefore:', before);

      if (typeof OneSignal?.Notifications?.requestPermission !== 'function') {
        throw new Error(
          `OneSignal.Notifications.requestPermission is not available (got ${typeof OneSignal?.Notifications?.requestPermission})`
        );
      }
      if (typeof OneSignal?.login !== 'function') {
        throw new Error(`OneSignal.login is not a function (got ${typeof OneSignal?.login})`);
      }

      // Request permission with TRUE to show native iOS dialog
      console.log('[OneSignal Debug] Awaiting requestPermission(true) - should show iOS dialog...');
      await OneSignal.Notifications.requestPermission(true);
      console.log('[OneSignal Debug] after requestPermission(true) resolved');
      setAfterRequestPermission(true);

      // Read permission after
      const after = await readPermissionStatus(OneSignal);
      setCurrentPermission(after);
      console.log('[OneSignal Debug] permission after request:', after);

      // Now call login
      console.log('[OneSignal Debug] Calling login with:', user.id);
      const loginAttempt = await withTimeout(
        Promise.resolve(OneSignal.login(user.id)),
        5000,
        'OneSignal.login'
      );

      if (loginAttempt.ok) {
        console.log('[OneSignal Debug] loginResult: success');
        setLoginResult('success');
        setLoginCalled(true);
        setLoginUserId(user.id);
        window.dispatchEvent(
          new CustomEvent('onesignal-login-called', { detail: { userId: user.id } })
        );
      } else {
        const reason = (loginAttempt as any).reason as 'timeout' | 'error' | undefined;
        const errMsg = (loginAttempt as any).error as string | undefined;

        if (reason === 'timeout') {
          console.warn('[OneSignal Debug] loginResult: timeout');
          setLoginResult('timeout');
          setLoginCalled(false);
          setLoginError('login timeout');
        } else {
          console.error('[OneSignal Debug] loginResult: error:', errMsg);
          setLoginResult(`error: ${errMsg || 'unknown'}`);
          setLoginCalled(false);
          setLoginError(errMsg || 'Unknown login error');
        }
      }
    } catch (err: any) {
      console.error('[OneSignal Debug] Enable notifications failed:', err);
      setLoginError(err?.message || String(err));
      setLoginCalled(false);
      setLoginResult(`error: ${err?.message || String(err)}`);
    } finally {
      setEnabling(false);
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
          <span className="text-gray-400">Current Permission:</span>{' '}
          <span className={currentPermission === 'true' || currentPermission === 'granted' ? 'text-green-400' : 'text-yellow-400'}>
            {currentPermission}
          </span>
        </div>
        <div>
          <span className="text-gray-400">permStatusBefore:</span>{' '}
          <span className="text-blue-400">{permStatusBefore}</span>
        </div>
        <div>
          <span className="text-gray-400">after requestPermission:</span>{' '}
          <span className={afterRequestPermission ? 'text-green-400' : 'text-red-400'}>
            {afterRequestPermission ? 'true ✓' : 'false ❌'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">loginResult:</span>{' '}
          <span className={
            loginResult === 'success'
              ? 'text-green-400'
              : loginResult === 'timeout'
                ? 'text-yellow-400'
                : loginResult
                  ? 'text-red-400'
                  : 'text-gray-400'
          }>
            {loginResult || 'pending'}
          </span>
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
          onClick={handleEnableNotifications}
          disabled={enabling || !initialized || !user?.id}
          className="mt-2 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-1 px-2 rounded"
        >
          {enabling ? 'Enabling...' : '📳 Enable Notifications'}
        </button>
        <button
          onClick={handleForceLogin}
          disabled={forcing || !initialized || !user?.id}
          className="mt-1 w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-1 px-2 rounded"
        >
          {forcing ? 'Forcing...' : 'Force OneSignal Login'}
        </button>
      </div>
    </div>
  );
};
