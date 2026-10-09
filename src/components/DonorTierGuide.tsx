import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DONOR_TIERS, TIER_ICONS } from "@/config/donorTiers";

export function DonorTierGuide({ tierKey, onClose }: { tierKey: string | null; onClose: () => void }) {
  const selected = DONOR_TIERS.find((tier) => tier.key === tierKey);
  return (
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`donor-tier-guide donor-tier-${selected?.key ?? "angel"} max-w-sm w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] gap-2 overflow-hidden rounded-lg p-4 text-center`}>
        {selected && <img src={TIER_ICONS[selected.key]} alt={selected.name} className="donor-guide-portrait mx-auto rounded-full object-cover" />}
        <DialogTitle className="text-center text-xl tracking-normal">Donator tiers</DialogTitle>
        <DialogDescription className="text-center text-xs leading-4">Your tier reflects your lifetime donations, minus refunds. Every gift makes a difference.</DialogDescription>
        <ol className="donor-guide-tiers text-left">
          {DONOR_TIERS.map((tier) => (
            <li key={tier.key} className={`donor-guide-tier donor-tier-${tier.key} flex items-center gap-3 rounded-md px-2 ${tier.key === tierKey ? "donor-guide-tier-selected" : ""}`}>
              <img src={TIER_ICONS[tier.key]} alt="" className="donor-guide-tier-icon shrink-0 rounded-full object-cover" />
              <span className="flex-1 text-sm font-semibold">{tier.name}</span>
              <span className="text-sm tabular-nums">${(tier.minCents / 100).toLocaleString("en-US")}+</span>
            </li>
          ))}
        </ol>
        <p className="text-xs leading-4 text-muted-foreground">Lifetime totals in US dollars. These are supporter titles, not spiritual ranks.</p>
      </DialogContent>
    </Dialog>
  );
}