import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DonationDialog } from "@/components/DonationDialog";
import { DONOR_TEXT, DONOR_TIERS, TIER_ICONS } from "@/config/donorTiers";

interface DonorRow { rank: number; key: string; username: string; profile_picture_url: string | null; tierKey: string | null }

const MEDALS = [
  "from-[hsl(45_90%_62%)] to-[hsl(38_80%_42%)]",
  "from-[hsl(210_15%_85%)] to-[hsl(210_10%_55%)]",
  "from-[hsl(25_60%_68%)] to-[hsl(20_50%_42%)]",
];

const RankBadge = ({ rank, size = "md" }: { rank: number; size?: "sm" | "md" }) => {
  const dim = size === "md" ? "h-9 w-9" : "h-7 w-7";
  if (rank > 3) return <span className={`${dim} flex items-center justify-center text-sm text-muted-foreground`}>{rank}</span>;
  return (
    <span className={`${dim} relative flex shrink-0 items-center justify-center`}>
      <span className={`absolute inset-1 rotate-45 rounded-[4px] bg-gradient-to-br ${MEDALS[rank - 1]} shadow-sm`} />
      <span className="relative text-xs font-bold text-background">{rank}</span>
    </span>
  );
};

const tierName = (k: string | null) => DONOR_TIERS.find((t) => t.key === k)?.name ?? "";

export const DonorsSection = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ month: DonorRow[]; lifetime: DonorRow[] } | null>(null);
  const [period, setPeriod] = useState<"month" | "lifetime">("lifetime");
  const [expanded, setExpanded] = useState(false);
  const [hasDonated, setHasDonated] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);

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
                <Heart className="h-5 w-5 text-primary" />
                {DONOR_TEXT.sectionTitle}
              </CardTitle>
              <CardDescription>{DONOR_TEXT.sectionSubtitle}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDonateOpen(true)}
              className={`shrink-0 text-xs ${hasDonated ? "" : "donor-glow border-primary/60"}`}>
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
              <div className="grid grid-cols-3 gap-2">
                {top3.map((d) => (
                  <div key={d.key} className="flex min-w-0 items-center gap-1.5">
                    <RankBadge rank={d.rank} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{d.username}</div>
                      {d.tierKey && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <img src={TIER_ICONS[d.tierKey]} alt="" className="h-4 w-4 rounded-full object-cover" />
                          <span className="truncate">{tierName(d.tierKey)}</span>
                        </div>
                      )}
                    </div>
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
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`rounded-md py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                      {p === "month" ? DONOR_TEXT.thisMonth : DONOR_TEXT.allTime}
                    </button>
                  ))}
                </div>
                {list.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{DONOR_TEXT.empty}</div>
                ) : list.map((d) => (
                  <div key={d.key} className="flex items-center gap-3 px-1 py-1.5">
                    <RankBadge rank={d.rank} size="sm" />
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={d.profile_picture_url || undefined} />
                      <AvatarFallback>{d.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{d.username}</span>
                    <span className="shrink-0 text-xs text-primary">{tierName(d.tierKey)}</span>
                  </div>
                ))}
              </CollapsibleContent>
            </>
          )}
        </CardContent>
      </Card>
      <DonationDialog open={donateOpen} onOpenChange={setDonateOpen} />
    </Collapsible>
  );
};
