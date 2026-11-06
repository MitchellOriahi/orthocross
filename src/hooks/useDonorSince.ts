import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDonorDonationCount(userId: string | undefined) {
  const { data, refetch } = useQuery({
    queryKey: ["profile-donor-count", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return null;
      const { count, error } = await supabase.from("donations")
        .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "confirmed");
      if (error) throw error;
      return count;
    },
  });
  useEffect(() => {
    if (!userId) return;
    const refresh = () => { void refetch(); };
    window.addEventListener("orthocross:donors-changed", refresh);
    return () => window.removeEventListener("orthocross:donors-changed", refresh);
  }, [userId, refetch]);
  return userId ? data ?? null : null;
}