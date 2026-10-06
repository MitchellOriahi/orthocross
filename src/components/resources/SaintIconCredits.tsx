import type { SaintIconCredit } from "@/data/saintTypes";

export function SaintIconCredits({ credit }: { credit: SaintIconCredit }) {
  return (
    <details className="mt-6 text-xs text-muted-foreground">
      <summary className="cursor-pointer">Icon credits</summary>
      <div className="mt-2 space-y-1 break-words">
        <p>{credit.title} — {credit.author}</p>
        <p>
          <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline">Original icon</a>
          {" · "}
          <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{credit.license}</a>
        </p>
        <p>{credit.modification}</p>
      </div>
    </details>
  );
}