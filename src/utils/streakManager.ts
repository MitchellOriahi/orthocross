import { supabase } from "@/integrations/supabase/client";

export interface GuardianAngelResult {
  saved: boolean;
  newStreak: number;
  savesCount: number;
  remainingPercentage: number;
}

/**
 * Checks the user's streak on app open via server-side RPC.
 * The server determines whether guardian angel intervention applies and updates state atomically.
 * Returns guardian angel result if a streak-loss event occurred, null otherwise.
 */
export const checkStreakOnAppOpen = async (
  _userId: string
): Promise<GuardianAngelResult | null> => {
  try {
    const { data, error } = await supabase.rpc('process_streak_check');
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    // No streak-loss event happened (still within window)
    if (row.saved === false && row.current_streak !== 0) return null;

    return {
      saved: !!row.saved,
      newStreak: row.current_streak ?? 0,
      savesCount: row.guardian_angel_saves ?? 0,
      remainingPercentage: row.guardian_angel_percentage ?? 0,
    };
  } catch (error) {
    console.error('Error checking guardian angel:', error);
    return null;
  }
};

/**
 * Updates the user's streak based on daily activity completion via server-side RPC.
 * Returns the new streak count.
 */
export const updateUserStreak = async (_userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('record_daily_activity');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row?.current_streak ?? 0;
  } catch (error) {
    console.error('Error updating user streak:', error);
    return 0;
  }
};
