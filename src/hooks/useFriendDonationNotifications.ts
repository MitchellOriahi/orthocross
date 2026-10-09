import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFriendDonationNotifications() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const shown = new Set<string>();
    const showUnread = async () => {
      const { data: settings } = await supabase.from("profiles")
        .select("friends_notifications_enabled").eq("id", user.id).maybeSingle();
      if (cancelled || settings?.friends_notifications_enabled === false) return;
      const { data: alerts } = await supabase.from("friend_donation_notifications")
        .select("id, donor_name").eq("recipient_id", user.id).is("read_at", null)
        .order("created_at", { ascending: false }).limit(10);
      for (const alert of alerts ?? []) {
        if (cancelled || shown.has(alert.id)) continue;
        shown.add(alert.id);
        toast("A friend supported OrthoCross", {
          description: `${alert.donor_name} made a donation. May God bless their generosity!`,
        });
        await supabase.from("friend_donation_notifications")
          .update({ read_at: new Date().toISOString() }).eq("id", alert.id);
      }
    };
    const channel = supabase.channel(`friend-donations-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "friend_donation_notifications",
        filter: `recipient_id=eq.${user.id}`,
      }, () => { void showUnread(); })
      .subscribe((status) => { if (status === "SUBSCRIBED") void showUnread(); });
    void showUnread();
    return () => { cancelled = true; void supabase.removeChannel(channel); };
  }, [user]);
}