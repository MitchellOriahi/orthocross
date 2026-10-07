// Single source of truth for donor tiers and donation wording.
// Edit thresholds (in US cents) and text here; both the app and the server use this file.

export interface DonorTier {
  key: string;
  name: string;
  article: "a" | "an";
  minCents: number;
}

export const DONOR_TIERS: DonorTier[] = [
  { key: "angel", name: "Angel", article: "an", minCents: 100 },
  { key: "archangel", name: "Archangel", article: "an", minCents: 1000 },
  { key: "principality", name: "Principality", article: "a", minCents: 2500 },
  { key: "power", name: "Power", article: "a", minCents: 5000 },
  { key: "virtue", name: "Virtue", article: "a", minCents: 10000 },
  { key: "dominion", name: "Dominion", article: "a", minCents: 25000 },
  { key: "throne", name: "Throne", article: "a", minCents: 50000 },
  { key: "cherub", name: "Cherub", article: "a", minCents: 75000 },
  { key: "seraph", name: "Seraph", article: "a", minCents: 100000 },
];

export const DONOR_TEXT = {
  sectionTitle: "Donators",
  sectionSubtitle: "Generous supporters of the community",
  becomeDonator: "Become a donator",
  showAll: "Show all donors",
  showLess: "Show less",
  thisMonth: "This month",
  allTime: "All time",
  empty: "No donors yet. Be the first.",
  anonymousName: "Anonymous Donor",
  showMyName: "Show my name",
  donateAnonymously: "Donate anonymously",
  thankYouTitle: (name: string) => `Thank you, ${name}.`,
  thankYouBody:
    "Your gift helps keep this app free and growing, and we are grateful for you. May God continue to bless you.",
  youAreNow: (t: DonorTier) => `You are now ${t.article} ${t.name}.`,
  risen: (from: DonorTier | null, to: DonorTier) =>
    from ? `You've risen from ${from.name} to ${to.name}!` : `You've joined the ranks as ${to.article} ${to.name}!`,
  toNext: (cents: number, next: DonorTier) => `$${(cents / 100).toFixed(2).replace(/\.00$/, "")} more to reach ${next.name}`,
  topTier: "You have reached the highest tier. Thank you!",
  pending: "Confirming your donation with Stripe…",
};

export const getTier = (totalCents: number): DonorTier | null => {
  let found: DonorTier | null = null;
  for (const t of DONOR_TIERS) if (totalCents >= t.minCents) found = t;
  return found;
};

export const getNextTier = (totalCents: number): { tier: DonorTier; remainingCents: number } | null => {
  const next = DONOR_TIERS.find((t) => totalCents < t.minCents);
  return next ? { tier: next, remainingCents: next.minCents - totalCents } : null;
};
