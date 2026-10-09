import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Crown, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DonationDialog } from "@/components/DonationDialog";
import { DONOR_TEXT } from "@/config/donorTiers";
import { DonorRow, DonorTierButton } from "@/components/DonorPodium";
import { DonorTierGuide } from "@/components/DonorTierGuide";

const DonorListRow = ({ donor, onSelectTier }: { donor: DonorRow; onSelectTier: (key: string) => void }) => (
  <div className={`donor-list-row donor-tier-${donor.tierKey ?? "none"} flex items-center gap-2.5 px-1.5 py-2`}>
    <span className="relative inline-block shrink-0">
      {donor.rank === 1 && <Crown className="donor-list-crown" aria-label="First place" />}
      <Avatar className="donor-avatar-ring h-8 w-8">
        <AvatarImage src={donor.profile_picture_url || undefined} alt={`${donor.username}'s profile picture`} />
        <AvatarFallback>{donor.username.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </span>
    <span className="min-w-0 flex-1 truncate text-sm font-medium">{donor.username}</span>
    <DonorTierButton donor={donor} onSelect={onSelectTier} />
  </div>
);

export const DonorsSection = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ month: DonorRow[]; lifetime: DonorRow[] } | null>(null);
  const [period, setPeriod] = useState<"month" | "lifetime">("lifetime");
  const [expanded, setExpanded] = useState(false);
  const [hasDonated, setHasDonated] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: res } = await supabase.functions.invoke("donor-leaderboard");
    if (res?.lifetime) setData(res);
    if (user) {
      const { data: st } = await supabase.functions.invoke("donor-status", { body: {} });
      if (st) setHasDonated(!!st.hasDonated);
    } else setHasDonated(false);
  }, [user]);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("orthocross:donors-changed", h);
    return () => window.removeEventListener("orthocross:donors-changed", h);
  }, [load]);

  const top3 = data?.lifetime.slice(0, 3) ?? [];
  const list = data ? data[period] : [];

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[hsl(var(--donor-heart))]" />
                {DONOR_TEXT.sectionTitle}
              </CardTitle>
              <CardDescription>{DONOR_TEXT.sectionSubtitle}</CardDescription>
            </div>
            <Button size="sm" variant="sacred" onClick={() => setDonateOpen(true)}
              className={`shrink-0 text-xs ${hasDonated ? "" : "donor-glow"}`}>
              {DONOR_TEXT.becomeDonator}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />)}
            </div>
          ) : top3.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{DONOR_TEXT.empty}</div>
          ) : (
            <>
              <div className="grid grid-cols-3 items-start">
                {top3.map((d) => (
                  <div key={d.key} className={`donor-tier-${d.tierKey ?? "none"} flex min-w-0 flex-col items-center gap-1.5 rounded-lg p-1 text-center`}>
                    <span className="relative inline-block shrink-0">
                      {d.rank === 1 && <Crown className="donor-list-crown" aria-label="First place" />}
                      <Avatar className="donor-avatar-ring donor-avatar-podium h-12 w-12">
                        <AvatarImage src={d.profile_picture_url || undefined} alt={`${d.username}'s profile picture`} />
                        <AvatarFallback>{d.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </span>
                    <span className="w-full truncate text-xs font-semibold leading-tight">{d.username}</span>
                    <DonorTierButton donor={d} onSelect={setSelectedTier} />
                  </div>
                ))}
              </div>

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-3 w-full text-xs text-muted-foreground">
                  {expanded ? <><ChevronUp className="mr-1 h-4 w-4" />{DONOR_TEXT.showLess}</> : <><ChevronDown className="mr-1 h-4 w-4" />{DONOR_TEXT.showAll}</>}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-1">
                <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1">
                  {(["month", "lifetime"] as const).map((p) => (
                    <Button variant="ghost" size="sm" key={p} onClick={() => setPeriod(p)} aria-pressed={period === p}
                      className={`rounded-md py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                      {p === "month" ? DONOR_TEXT.thisMonth : DONOR_TEXT.allTime}
                    </Button>
                  ))}
                </div>
                {list.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{DONOR_TEXT.empty}</div>
                ) : list.map((d) => (
                  <DonorListRow key={d.key} donor={d} onSelectTier={setSelectedTier} />
                ))}
              </CollapsibleContent>
            </>
          )}
        </CardContent>
      </Card>
      <DonationDialog open={donateOpen} onOpenChange={setDonateOpen} />
      <DonorTierGuide tierKey={selectedTier} onClose={() => setSelectedTier(null)} />
    </Collapsible>
  );
};
