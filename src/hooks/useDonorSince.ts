import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDonorSince(userId: string | undefined) {
  const { data, refetch } = useQuery({
    queryKey: ["profile-donor-since", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return null;
      const { data: first, error } = await supabase.from("donations")
        .select("donated_at").eq("user_id", userId).eq("status", "confirmed")
        .order("donated_at", { ascending: true }).limit(1).maybeSingle();
      if (error) throw error;
      return first?.donated_at ?? null;
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