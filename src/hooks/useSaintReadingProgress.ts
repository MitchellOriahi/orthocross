import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { completedSaintIds, earnsAllSaintsAward } from "@/data/saintReadingProgress";

export function useSaintReadingProgress() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ["saint-reading-progress", user?.id];
  const progress = useQuery({
    queryKey,
    enabled: Boolean(user),
    queryFn: async () => {
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
    },
  });
  const completion = useMutation({
    mutationFn: async (saintId: string) => {
      if (!user) throw new Error("Please sign in to save your saint reading progress.");
      // Await the full lifetime history before evaluating the final-story award.
      const before = await client.fetchQuery({ queryKey, queryFn: progress.refetch.bind(null).length ? undefined : undefined }).catch(() => undefined);
      const existing = before as Set<string> | undefined;
      const current = existing ?? progress.data;
      if (!current) throw new Error("Your reading progress is not ready yet. Please try again.");
      if (!current.has(saintId)) {
        const { error } = await supabase.from("saints_read").insert({ user_id: user.id, saint_id: saintId });
        if (error) throw error;
      }
      const after = new Set(current).add(saintId);
      client.setQueryData(queryKey, after);
      return { earnedAward: earnsAllSaintsAward(current, after) };
    },
  });
  return { completed: progress.data ?? new Set<string>(), completion, isLoading: progress.isLoading };
}