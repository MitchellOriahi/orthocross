import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DONOR_TIERS, TIER_ICONS } from "@/config/donorTiers";

export function DonorTierGuide({ tierKey, onClose }: { tierKey: string | null; onClose: () => void }) {
  const selected = DONOR_TIERS.find((tier) => tier.key === tierKey);
  return (
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="donor-tier-guide max-w-sm w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto text-center">
        {selected && <img src={TIER_ICONS[selected.key]} alt={selected.name} className="donor-guide-portrait mx-auto h-20 w-20 rounded-full object-cover" />}
        <DialogTitle className="text-center text-2xl">Donator tiers</DialogTitle>
        <DialogDescription className="text-center">Your tier reflects your lifetime donations, minus refunds. Every gift makes a difference.</DialogDescription>
        <ol className="space-y-1 text-left">
          {DONOR_TIERS.map((tier) => (
            <li key={tier.key} className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${tier.key === tierKey ? "bg-accent ring-1 ring-border" : ""}`}>
              <img src={TIER_ICONS[tier.key]} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              <span className="flex-1 text-sm font-semibold">{tier.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">${(tier.minCents / 100).toLocaleString("en-US")}+</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">Lifetime totals in US dollars. These are supporter titles, not spiritual ranks.</p>
        <Button variant="sacred" onClick={onClose} className="w-full">Continue</Button>
      </DialogContent>
    </Dialog>
  );
}