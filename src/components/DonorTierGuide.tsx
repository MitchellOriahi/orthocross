import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DONOR_TIERS, TIER_ICONS } from "@/config/donorTiers";

export function DonorTierGuide({ tierKey, onClose }: { tierKey: string | null; onClose: () => void }) {
  const selected = DONOR_TIERS.find((tier) => tier.key === tierKey);
  return (
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="donor-tier-guide donor-tier-seraph max-w-sm w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] gap-2 overflow-hidden rounded-lg p-4 text-center">
        <img src={TIER_ICONS.seraph} alt="Seraph" className="donor-guide-portrait mx-auto rounded-full object-cover" />
        <DialogTitle className="text-center text-xl tracking-normal">Donator tiers</DialogTitle>
        <DialogDescription className="sr-only">Donator tiers from Seraph to Angel</DialogDescription>
        <ol className="donor-guide-tiers text-left">
          {[...DONOR_TIERS].reverse().map((tier) => (
            <li key={tier.key} className={`donor-guide-tier donor-tier-${tier.key} flex items-center gap-3 rounded-md px-2 ${tier.key === tierKey ? "donor-guide-tier-selected" : ""}`}>
              <img src={TIER_ICONS[tier.key]} alt="" className="donor-guide-tier-icon shrink-0 rounded-full object-cover" />
              <span className="flex-1 text-sm font-semibold">{tier.name}</span>
              <span className="text-sm tabular-nums">${(tier.minCents / 100).toLocaleString("en-US")}+</span>
            </li>
          ))}
        </ol>
        <p className="text-xs leading-4 text-muted-foreground">Your tier reflects every gift you've given over time. Thank you for helping keep the faith within reach of all.</p>
      </DialogContent>
    </Dialog>
  );
}