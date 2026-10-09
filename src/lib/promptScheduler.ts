// Shared coordinator for the automatic donation sticker and rating prompt.
// Pure rule functions + a small localStorage-backed store.

export const DAY = 86_400_000;
export const SESSION_GAP_MS = 30 * 60_000; // completions within 30 min = one session

export const RULES = {
  donationMinDays: 7,
  donationMinSessions: 5,
  donationFirstDismissCooldownDays: 60,
  donationRepeatDismissCooldownDays: 90,
  donationAfterContributionEndDays: 90,
  ratingMinDays: 14,
  ratingMinSessions: 10,
  ratingRepeatDays: 180,
  ratingMaxPerYear: 2,
  ratingDismissCooldownDays: 180,
  crossPromptGapDays: 30,
};

export type PromptType = "donation" | "rating";

export interface PromptState {
  firstSessionAt: number | null;
  sessionCount: number;
  lastActivityAt: number | null;
  countedKeys: string[];
  donationShownAt: number | null;
  donationDismissedAt: number | null;
  donationDismissCount: number;
  donationRemindersOff: boolean;
  wasActiveDonor: boolean;
  contributionEndedAt: number | null;
  lastDonatedAt: number | null;
  ratingRequests: number[];
  ratingDismissedAt: number | null;
  lastPromptAt: number | null;
  lastPromptType: PromptType | null;
  events: { type: string; at: number }[];
}

export const emptyState = (): PromptState => ({
  firstSessionAt: null, sessionCount: 0, lastActivityAt: null, countedKeys: [],
  donationShownAt: null, donationDismissedAt: null, donationDismissCount: 0,
  donationRemindersOff: false, wasActiveDonor: false, contributionEndedAt: null,
  lastDonatedAt: null, ratingRequests: [], ratingDismissedAt: null,
  lastPromptAt: null, lastPromptType: null, events: [],
});

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function sanitize(raw: unknown): PromptState {
  const s = emptyState();
  if (!raw || typeof raw !== "object") return s;
  const r = raw as Record<string, unknown>;
  for (const k of ["firstSessionAt", "lastActivityAt", "donationShownAt", "donationDismissedAt",
    "contributionEndedAt", "lastDonatedAt", "ratingDismissedAt", "lastPromptAt"] as const) {
    (s as any)[k] = num(r[k]);
  }
  s.sessionCount = Math.max(0, num(r.sessionCount) ?? 0);
  s.donationDismissCount = Math.max(0, num(r.donationDismissCount) ?? 0);
  s.donationRemindersOff = r.donationRemindersOff === true;
  s.wasActiveDonor = r.wasActiveDonor === true;
  s.countedKeys = Array.isArray(r.countedKeys) ? r.countedKeys.filter(k => typeof k === "string").slice(-300) : [];
  s.ratingRequests = Array.isArray(r.ratingRequests) ? r.ratingRequests.filter(n => num(n) !== null) as number[] : [];
  s.lastPromptType = r.lastPromptType === "donation" || r.lastPromptType === "rating" ? r.lastPromptType : null;
  s.events = Array.isArray(r.events) ? (r.events as any[]).filter(e => e && typeof e.type === "string" && num(e.at) !== null).slice(-100) : [];
  return s;
}

const log = (s: PromptState, type: string, now: number): PromptState =>
  ({ ...s, events: [...s.events, { type, at: now }].slice(-100) });

/** Record a qualifying completion. Duplicates and same-session completions don't add sessions. */
export function recordCompletion(s: PromptState, key: string, now: number): PromptState {
  if (s.countedKeys.includes(key)) return s;
  const newSession = s.lastActivityAt === null || now - s.lastActivityAt > SESSION_GAP_MS;
  return {
    ...s,
    countedKeys: [...s.countedKeys, key].slice(-300),
    firstSessionAt: s.firstSessionAt ?? now,
    lastActivityAt: now,
    sessionCount: s.sessionCount + (newSession ? 1 : 0),
  };
}

export type DonorStatus = "active" | "inactive" | "unknown";

/** Update contribution tracking from the verified server status. */
export function applyDonorStatus(s: PromptState, status: DonorStatus, now: number): PromptState {
  if (status === "active") return { ...s, wasActiveDonor: true };
  if (status === "inactive" && s.wasActiveDonor) return { ...s, wasActiveDonor: false, contributionEndedAt: now };
  return s;
}

const since = (t: number | null, now: number, days: number) => t === null || now - t >= days * DAY;

function crossGapOk(s: PromptState, type: PromptType, now: number) {
  if (s.lastPromptType && s.lastPromptType !== type) return since(s.lastPromptAt, now, RULES.crossPromptGapDays);
  return true;
}

export function donationEligible(s: PromptState, now: number, status: DonorStatus): boolean {
  if (s.donationRemindersOff || status !== "inactive") return false;
  if (s.firstSessionAt === null || now - s.firstSessionAt < RULES.donationMinDays * DAY) return false;
  if (s.sessionCount < RULES.donationMinSessions) return false;
  if (s.donationDismissCount > 0) {
    const cd = s.donationDismissCount === 1 ? RULES.donationFirstDismissCooldownDays : RULES.donationRepeatDismissCooldownDays;
    if (!since(s.donationDismissedAt, now, cd)) return false;
  }
  if (!since(s.donationShownAt, now, RULES.donationFirstDismissCooldownDays)) return false;
  if (!since(s.contributionEndedAt, now, RULES.donationAfterContributionEndDays)) return false;
  if (!since(s.lastDonatedAt, now, RULES.donationAfterContributionEndDays)) return false;
  return crossGapOk(s, "donation", now);
}

export function ratingEligible(s: PromptState, now: number): boolean {
  if (s.firstSessionAt === null || now - s.firstSessionAt < RULES.ratingMinDays * DAY) return false;
  if (s.sessionCount < RULES.ratingMinSessions) return false;
  const last = s.ratingRequests.length ? Math.max(...s.ratingRequests) : null;
  if (!since(last, now, RULES.ratingRepeatDays)) return false;
  if (s.ratingRequests.filter(t => now - t < 365 * DAY).length >= RULES.ratingMaxPerYear) return false;
  if (!since(s.ratingDismissedAt, now, RULES.ratingDismissCooldownDays)) return false;
  return crossGapOk(s, "rating", now);
}

/** At most one prompt per session. If both qualify, alternate so neither is always preferred. */
export function choosePrompt(s: PromptState, now: number, status: DonorStatus): PromptType | null {
  const d = donationEligible(s, now, status);
  const r = ratingEligible(s, now);
  if (d && r) return s.lastPromptType === "donation" ? "rating" : s.lastPromptType === "rating" ? "donation" : null;
  return d ? "donation" : r ? "rating" : null;
}

export function markShown(s: PromptState, type: PromptType, now: number): PromptState {
  const next = { ...s, lastPromptAt: now, lastPromptType: type };
  if (type === "donation") return log({ ...next, donationShownAt: now }, "donation_displayed", now);
  return log({ ...next, ratingRequests: [...s.ratingRequests, now].filter(t => now - t < 365 * DAY) }, "rating_requested", now);
}

export function markDismissed(s: PromptState, type: PromptType, now: number): PromptState {
  if (type === "donation") return log({ ...s, donationDismissedAt: now, donationDismissCount: s.donationDismissCount + 1 }, "donation_dismissed", now);
  return log({ ...s, ratingDismissedAt: now }, "rating_dismissed", now);
}

export const markEvent = log;

// ---------- persistence ----------
const key = (userId?: string | null) => `orthocross_prompt_schedule_v1_${userId ?? "anon"}`;

export function loadState(userId?: string | null): PromptState {
  try {
    const own = localStorage.getItem(key(userId));
    if (own) return sanitize(JSON.parse(own));
    if (userId) { // migrate anonymous progress on first sign-in
      const anon = localStorage.getItem(key(null));
      if (anon) return sanitize(JSON.parse(anon));
    }
  } catch { /* corrupted -> fresh */ }
  return emptyState();
}

export function saveState(userId: string | null | undefined, s: PromptState) {
  try { localStorage.setItem(key(userId), JSON.stringify(s)); } catch { /* ignore */ }
}

export function updateState(userId: string | null | undefined, fn: (s: PromptState) => PromptState) {
  const next = fn(loadState(userId));
  saveState(userId, next);
  return next;
}

/** Call from Bible/saint/history completion. Never blocks or alters streak logic. */
export function trackMeaningfulCompletion(userId: string | null | undefined, activityKey: string) {
  const day = new Date().toISOString().slice(0, 10);
  updateState(userId, s => recordCompletion(s, `${activityKey}@${day}`, Date.now()));
}

// in-memory session guard: one prompt per app session, never reopened after dismissal
let promptedThisSession = false;
export const sessionGuard = {
  get used() { return promptedThisSession; },
  use() { promptedThisSession = true; },
};
