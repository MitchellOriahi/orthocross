import evidence from "./saintAssociationEvidence.json";

// Reuse the complete, already-translated source passage without rewriting a life.
export function getSaintRelationship(saintId: string, associatedId: string): string | undefined {
  return evidence.find(entry =>
    (entry.a === saintId && entry.b === associatedId) ||
    (entry.b === saintId && entry.a === associatedId)
  )?.quote;
}