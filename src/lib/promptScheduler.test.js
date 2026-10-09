import { describe, expect, test } from "bun:test";
import { DAY, emptyState, recordCompletion, donationEligible, ratingEligible, choosePrompt, markShown, markDismissed, applyDonorStatus, sanitize } from "./promptScheduler";

const T0 = 1_800_000_000_000;
const HOUR = 3_600_000;
function withSessions(n, start = T0) {
  let s = emptyState();
  for (let i = 0; i < n; i++) s = recordCompletion(s, `ch${i}`, start + i * 2 * HOUR);
  return s;
}

describe("prompt scheduler", () => {
  test("new user not eligible", () => {
    const s = withSessions(2);
    expect(donationEligible(s, T0 + 30 * DAY, "inactive")).toBe(false);
    expect(donationEligible(withSessions(5), T0 + 6 * DAY, "inactive")).toBe(false);
  });
  test("5 sessions + 7 days -> donation eligible", () => {
    expect(donationEligible(withSessions(5), T0 + 7 * DAY, "inactive")).toBe(true);
  });
  test("many chapters in one sitting count as one session; duplicates ignored", () => {
    let s = emptyState();
    for (let i = 0; i < 10; i++) s = recordCompletion(s, `ch${i}`, T0 + i * 60_000);
    s = recordCompletion(s, "ch0", T0 + 5 * HOUR);
    expect(s.sessionCount).toBe(1);
  });
  test("mixed categories each count", () => {
    let s = recordCompletion(emptyState(), "bible:gen1", T0);
    s = recordCompletion(s, "saint:x", T0 + 2 * HOUR);
    s = recordCompletion(s, "history:a", T0 + 4 * HOUR);
    expect(s.sessionCount).toBe(3);
  });
  test("dismissals: 60 then 90 days", () => {
    let s = markDismissed(markShown(withSessions(5), "donation", T0 + 7 * DAY), "donation", T0 + 7 * DAY);
    expect(donationEligible(s, T0 + 66 * DAY, "inactive")).toBe(false);
    expect(donationEligible(s, T0 + 67 * DAY, "inactive")).toBe(true);
    s = markDismissed(markShown(s, "donation", T0 + 67 * DAY), "donation", T0 + 67 * DAY);
    expect(donationEligible(s, T0 + 150 * DAY, "inactive")).toBe(false);
    expect(donationEligible(s, T0 + 157 * DAY, "inactive")).toBe(true);
  });
  test("active donor and unknown status never prompted", () => {
    expect(donationEligible(withSessions(5), T0 + 30 * DAY, "active")).toBe(false);
    expect(donationEligible(withSessions(5), T0 + 30 * DAY, "unknown")).toBe(false);
  });
  test("canceled contribution waits 90 days", () => {
    let s = applyDonorStatus(withSessions(5), "active", T0);
    s = applyDonorStatus(s, "inactive", T0 + 10 * DAY);
    expect(donationEligible(s, T0 + 99 * DAY, "inactive")).toBe(false);
    expect(donationEligible(s, T0 + 100 * DAY, "inactive")).toBe(true);
  });
  test("reminders off disables donation sticker", () => {
    expect(donationEligible({ ...withSessions(5), donationRemindersOff: true }, T0 + 30 * DAY, "inactive")).toBe(false);
  });
  test("rating: 10 sessions + 14 days, 180-day repeat, max 2/yr", () => {
    let s = withSessions(10);
    expect(ratingEligible(s, T0 + 13 * DAY)).toBe(false);
    expect(ratingEligible(s, T0 + 14 * DAY)).toBe(true);
    s = markShown(s, "rating", T0 + 14 * DAY);
    expect(ratingEligible(s, T0 + 193 * DAY)).toBe(false);
    expect(ratingEligible(s, T0 + 194 * DAY)).toBe(true);
  });
  test("30-day gap between donation and rating", () => {
    const s = markShown(withSessions(10), "donation", T0 + 14 * DAY);
    expect(ratingEligible(s, T0 + 43 * DAY)).toBe(false);
    expect(ratingEligible(s, T0 + 44 * DAY)).toBe(true);
  });
  test("both eligible -> only one prompt, alternating", () => {
    const first = choosePrompt(withSessions(10), T0 + 14 * DAY, "inactive");
    expect(["donation", "rating"]).toContain(first);
    const after = markShown(withSessions(10), "donation", T0 + 14 * DAY);
    expect(choosePrompt(after, T0 + 14 * DAY, "inactive")).toBe(null);
  });
  test("corrupted state is safe", () => {
    expect(sanitize("garbage").sessionCount).toBe(0);
    expect(sanitize({ sessionCount: "x", ratingRequests: [1, "a"] }).ratingRequests).toEqual([1]);
  });
});
