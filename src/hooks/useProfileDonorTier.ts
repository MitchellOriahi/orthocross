import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveProfileDonorTier } from "@/lib/donorProfileTier";

export function useProfileDonorTier(userId: string | undefined) {
  const { data, refetch } = useQuery({
    queryKey: ["profile-donor-tier", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: status, error } = await supabase.functions.invoke("donor-status", { body: {} });
      if (error) throw error;
      return resolveProfileDonorTier(status);
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
