import { supabase } from '@/integrations/supabase/client';

export const getDeviceTimezone = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

// Saves the device timezone only when the profile has none, so a zone the
// user picked in Settings is never overwritten.
export const syncDeviceTimezone = async (userId: string) => {
  const deviceZone = getDeviceTimezone();
  if (!deviceZone) return;
  await supabase
    .from('profiles')
    .update({ timezone: deviceZone })
    .eq('id', userId)
    .is('timezone', null);
};
