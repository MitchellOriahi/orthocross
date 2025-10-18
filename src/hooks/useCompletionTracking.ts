import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BIBLE_BOOKS } from '@/data/bibleContent';
import { saintsContent } from '@/data/saintsContent';
import { historyContent } from '@/data/historyContent';

interface CompletionStatus {
  bibleComplete: boolean;
  historyComplete: boolean;
  saintsComplete: boolean;
  allComplete: boolean;
}

export function useCompletionTracking() {
  const { user } = useAuth();
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    bibleComplete: false,
    historyComplete: false,
    saintsComplete: false,
    allComplete: false,
  });
  const [loading, setLoading] = useState(true);

  const checkCompletion = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check Bible completion
      const totalBibleChapters = BIBLE_BOOKS.reduce((sum, book) => sum + book.totalChapters, 0);
      const { count: completedBibleChapters } = await supabase
        .from('completed_chapters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const bibleComplete = (completedBibleChapters ?? 0) >= totalBibleChapters;

      // Check History completion (all islands in all campaigns)
      const totalHistoryIslands = historyContent.campaigns.reduce(
        (sum, campaign) => sum + campaign.islands.length,
        0
      );
      const { count: completedHistoryIslands } = await supabase
        .from('orthodox_history_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      const historyComplete = (completedHistoryIslands ?? 0) >= totalHistoryIslands;

      // Check Saints completion
      const totalSaints = saintsContent.length;
      const { count: readSaints } = await supabase
        .from('saints_read')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const saintsComplete = (readSaints ?? 0) >= totalSaints;

      const allComplete = bibleComplete && historyComplete && saintsComplete;

      setCompletionStatus({
        bibleComplete,
        historyComplete,
        saintsComplete,
        allComplete,
      });
    } catch (error) {
      console.error('Error checking completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetAllProgress = async () => {
    if (!user) return;

    try {
      // Delete all completed chapters
      await supabase
        .from('completed_chapters')
        .delete()
        .eq('user_id', user.id);

      // Delete all history progress
      await supabase
        .from('orthodox_history_progress')
        .delete()
        .eq('user_id', user.id);

      // Delete all saints read
      await supabase
        .from('saints_read')
        .delete()
        .eq('user_id', user.id);

      // Delete all reading progress
      await supabase
        .from('reading_progress')
        .delete()
        .eq('user_id', user.id);

      // Refresh completion status
      await checkCompletion();

      return true;
    } catch (error) {
      console.error('Error resetting progress:', error);
      return false;
    }
  };

  useEffect(() => {
    checkCompletion();
  }, [user]);

  return {
    completionStatus,
    loading,
    checkCompletion,
    resetAllProgress,
  };
}
