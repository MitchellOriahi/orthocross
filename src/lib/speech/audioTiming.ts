export interface TimedWord { s: number; e: number }

export interface TimingFile {
  duration?: number;
  words?: Array<{ i: number; w?: string; s: number; e: number }>;
}

/** Text that counts as a word (footnote markers / symbols alone don't). */
export const spokenForm = (word: string) =>
  word.replace(/\[[^\]]*\]/g, "").replace(/[*†‡¶§]/g, "").trim();

/**
 * Map the timing file onto the displayed words. If counts don't match, spread
 * the words across the duration in proportion to their character length.
 */
export function buildTimings(words: string[], file: TimingFile, duration: number): { timings: TimedWord[]; matched: boolean } {
  const fw = file.words ?? [];
  if (fw.length === words.length && fw.length > 0) {
    const sorted = [...fw].sort((a, b) => a.i - b.i);
    return { timings: sorted.map((w) => ({ s: w.s, e: w.e })), matched: true };
  }
  const total = duration || file.duration || 0;
  const lens = words.map((w) => Math.max(1, w.length));
  const sum = lens.reduce((a, b) => a + b, 0) || 1;
  let t = 0;
  const timings = lens.map((l) => {
    const d = (l / sum) * total;
    const out = { s: t, e: t + d };
    t += d;
    return out;
  });
  return { timings, matched: false };
}

/** Index of the word being spoken at time t (last word whose start ≤ t), or -1. */
export function wordAt(timings: TimedWord[], t: number): number {
  let lo = 0, hi = timings.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timings[mid].s <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}
