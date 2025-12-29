import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOneSignalUserLink } from '@/hooks/useOneSignalUserLink';
import { OneSignalDebug } from './OneSignalDebug';

export const NotificationManager = () => {
  const { user } = useAuth();
  
  // Initialize OneSignal user linking
  useOneSignalUserLink();

  // The notification scheduling is now handled server-side via edge functions
  // - Streak reminders: sent at 6pm if user hasn't completed any readings
  // - Fasting reminders: sent at 8pm the day before fasts/feasts

  // Render debug component (remove after testing)
  return <OneSignalDebug />;
};