import { supabase } from "@/integrations/supabase/client";

export interface GuardianAngelResult {
  saved: boolean;
  newStreak: number;
  savesCount: number;
  remainingPercentage: number;
}

/**
 * Checks if guardian angel should intervene to save a lost streak.
 * Returns true if the streak is saved, false otherwise.
 */
const checkGuardianAngelIntervention = (
  guardianAngelPercentage: number
): boolean => {
  const randomRoll = Math.random() * 100;
  return randomRoll < guardianAngelPercentage;
};

/**
 * Checks the user's streak on app open.
 * If more than 1 day has passed, may trigger guardian angel intervention.
 * Returns guardian angel result if intervention happened, null otherwise.
 */
export const checkStreakOnAppOpen = async (
  userId: string
): Promise<GuardianAngelResult | null> => {
  try {
    const { data: streakData, error } = await supabase
      .from('user_streaks')
      .select('current_streak, last_activity_date, guardian_angel_percentage, guardian_angel_saves')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!streakData || !streakData.last_activity_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivityDate = new Date(streakData.last_activity_date + 'T00:00:00');
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only check if more than 1 day has passed (streak would be lost)
    if (daysDifference > 1) {
      const guardianAngelSaves = checkGuardianAngelIntervention(
        streakData.guardian_angel_percentage
      );

      if (guardianAngelSaves) {
        // Guardian angel saves the streak
        const newSavesCount = streakData.guardian_angel_saves + 1;
        const newPercentage = Math.max(0, streakData.guardian_angel_percentage - 5);

        await supabase
          .from('user_streaks')
          .update({
            guardian_angel_saves: newSavesCount,
            guardian_angel_percentage: newPercentage,
            last_activity_date: today.toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        return {
          saved: true,
          newStreak: streakData.current_streak,
          savesCount: newSavesCount,
          remainingPercentage: newPercentage,
        };
      } else {
        // Guardian angel doesn't save - streak is lost
        // Apply 50% point penalty server-side
        await supabase.rpc('apply_streak_loss_penalty');


        await supabase
          .from('user_streaks')
          .update({
            current_streak: 0,
            last_activity_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        return {
          saved: false,
          newStreak: 0,
          savesCount: streakData.guardian_angel_saves,
          remainingPercentage: streakData.guardian_angel_percentage,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking guardian angel:', error);
    return null;
  }
};

/**
 * Updates the user's streak based on daily activity completion.
 * Increments streak by 1 if activity is completed on a new day.
 * Resets streak to 1 if more than 1 day has passed since last activity.
 * Returns the new streak count.
 */
export const updateUserStreak = async (userId: string): Promise<number> => {
  try {
    // Get current streak data
    const { data: streakData, error: fetchError } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight
    const todayString = today.toISOString().split('T')[0];

    let newStreak = 1;
    let newLongestStreak = 1;

    if (streakData) {
      const lastActivityDate = streakData.last_activity_date 
        ? new Date(streakData.last_activity_date + 'T00:00:00') 
        : null;

      if (lastActivityDate) {
        lastActivityDate.setHours(0, 0, 0, 0);
        const daysDifference = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDifference === 0) {
          // Same day, don't change streak
          return streakData.current_streak;
        } else if (daysDifference === 1) {
          // Next day, increment streak
          newStreak = streakData.current_streak + 1;
        } else {
          // More than 1 day gap, reset streak to 1
          newStreak = 1;
        }
      }

      // Update longest streak if current is higher
      newLongestStreak = Math.max(newStreak, streakData.longest_streak);

      // Update existing streak record
      const { error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_activity_date: todayString,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      // Create new streak record
      const { error: insertError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: todayString,
        });

      if (insertError) throw insertError;
      newStreak = 1;
    }

    return newStreak;
  } catch (error) {
    console.error('Error updating user streak:', error);
    return 0;
  }
};
