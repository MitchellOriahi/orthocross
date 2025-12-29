import { useOneSignalUserLink } from '@/hooks/useOneSignalUserLink';

/**
 * Temporary debug component to verify OneSignal integration.
 * Remove this component once everything is working.
 */
export const OneSignalDebug = () => {
  const debugState = useOneSignalUserLink();

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50 p-3 bg-black/90 text-white text-xs rounded-lg font-mono">
      <div className="font-bold mb-1 text-yellow-400">OneSignal Debug</div>
      <div className="space-y-0.5">
        <div>
          SDK initialized: {' '}
          <span className={debugState.initialized ? 'text-green-400' : 'text-red-400'}>
            {debugState.initialized ? 'true' : 'false'}
          </span>
        </div>
        <div>
          user.id: {' '}
          <span className="text-blue-400">
            {debugState.currentUserId || 'null'}
          </span>
        </div>
        <div>
          login() called: {' '}
          <span className={debugState.loginCalled ? 'text-green-400' : 'text-gray-400'}>
            {debugState.loginCalled ? 'true' : 'false'}
          </span>
        </div>
      </div>
    </div>
  );
};
