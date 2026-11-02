import type { SaintDetail } from "@/data/saintTypes";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { SaintCardIcon } from "./SaintCardIcon";
import { associatedSaintLabels } from "./associatedSaintLabels";
import { getAssociatedSaints } from "@/data/saintAssociations";

export function AssociatedSaints({ saintId, onSelect }: { saintId: string; onSelect: (saint: SaintDetail) => void }) {
  const { language, tr } = useLanguage();
  const saints = getAssociatedSaints(saintId);
  if (!saints.length) return null;

  return (
    <section className="mt-8 border-t border-border pt-6" aria-labelledby="associated-saints-heading">
      <h2 id="associated-saints-heading" className="mb-4 text-xl font-semibold" data-no-translate>
        {associatedSaintLabels[language] ?? associatedSaintLabels.en}
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {saints.map(saint => (
          <Button key={saint.id} variant="ghost" onClick={() => onSelect(saint)} data-associated-saint-id={saint.id} className="h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-lg border border-border p-3 text-start hover:border-primary">
            <SaintCardIcon saintId={saint.id} fallbackUrl={saint.iconUrl} className="!h-12 !w-12" />
            <span className="min-w-0 flex-1 text-base font-semibold leading-6" data-no-translate>
              {saint.prefix && <span>{tr(saint.prefix)} </span>}{tr(saint.name)}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}