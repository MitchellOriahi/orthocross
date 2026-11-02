import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { SaintCardIcon } from "./SaintCardIcon";
import { associatedSaintLabels } from "./associatedSaintLabels";
import { getAssociatedSaints } from "@/data/saintAssociations";
import { getSaintRelationship } from "@/data/saintRelationship";

export function AssociatedSaints({ saintId }: { saintId: string }) {
  const { language, tr } = useLanguage();
  const saints = getAssociatedSaints(saintId);
  if (!saints.length) return null;

  return (
    <section className="mt-8 border-t border-border pt-6" aria-labelledby="associated-saints-heading">
      <h2 id="associated-saints-heading" className="mb-4 text-xl font-semibold" data-no-translate>
        {associatedSaintLabels[language] ?? associatedSaintLabels.en}
      </h2>
      <div className="space-y-2">
        {saints.map(saint => (
          <Collapsible key={saint.id} className="rounded-lg border border-border">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" data-associated-saint-id={saint.id} className="group h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-lg p-3 text-start">
                <SaintCardIcon saintId={saint.id} fallbackUrl={saint.iconUrl} className="!h-12 !w-12" />
                <span className={`min-w-0 flex-1 text-base font-semibold leading-6${saint.id === "theotokos" ? " theotokos-name-tag" : ""}`} data-no-translate>
                  {saint.prefix && <span>{tr(saint.prefix)} </span>}{tr(saint.name)}
                </span>
                <ChevronDown aria-hidden="true" className="shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="border-t border-border px-4 py-4 text-base font-normal leading-relaxed whitespace-pre-line" data-no-translate>
                {tr(getSaintRelationship(saintId, saint.id) ?? "")}
              </p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </section>
  );
}