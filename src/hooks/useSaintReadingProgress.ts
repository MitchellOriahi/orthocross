import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { completedSaintIds, earnsAllSaintsAward } from "@/data/saintReadingProgress";

export function useSaintReadingProgress() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ["saint-reading-progress", user?.id];
  const loadProgress = async () => {
      if (!user) return new Set<string>();
      const reads: { saint_id: string }[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from("saints_read")
          .select("saint_id").eq("user_id", user.id).order("id").range(offset, offset + 999);
        if (error) throw error;
        reads.push(...data);
        if (data.length < 1000) break;
      }
      return completedSaintIds(reads);
  };
  const progress = useQuery({
    queryKey,
    enabled: Boolean(user),
    queryFn: loadProgress,
  });
  const completion = useMutation({
    mutationFn: async (saintId: string) => {
      if (!user) throw new Error("Please sign in to save your saint reading progress.");
      // Await the full lifetime history before evaluating the final-story award.
      const current = await client.fetchQuery({ queryKey, queryFn: loadProgress });
      const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;
      const { data: monthlyRead, error: readError } = await supabase.from("saints_read")
        .select("id").eq("user_id", user.id).eq("saint_id", saintId).gte("read_at", monthStart).limit(1);
      if (readError) throw readError;
      if (!monthlyRead?.length) {
        const { error } = await supabase.from("saints_read").insert({ user_id: user.id, saint_id: saintId });
        if (error) throw error;
        await supabase.rpc("award_leaderboard_point", { p_activity: "saint" });
      }
      const after = new Set(current).add(saintId);
      client.setQueryData(queryKey, after);
      const { updateUserStreak } = await import("@/utils/streakManager");
      await updateUserStreak(user.id);
      const saint = (await import("@/data/saintPageRoster")).saintPageRoster.find(record => record.id === saintId);
      if (saint) await supabase.rpc("log_friend_activity", {
        p_activity_type: "saint_completed",
        p_activity_data: { saint_name: `${saint.prefix} ${saint.name}` },
      });
      return { earnedAward: earnsAllSaintsAward(current, after) };
    },
  });
  return { completed: progress.data ?? new Set<string>(), completion, isLoading: progress.isLoading };
}