import { supabase } from "@/integrations/supabase/client";

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
