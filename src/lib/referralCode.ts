import { z } from "zod";

// A referral code is typed by hand, so keep the accepted shape narrow and
// predictable: letters, digits and dashes, 3-32 characters, stored uppercase.
export const REFERRAL_CODE_MIN = 3;
export const REFERRAL_CODE_MAX = 32;

const referralCodeSchema = z
  .string()
  .trim()
  .min(REFERRAL_CODE_MIN, { message: "Referral codes are at least 3 characters" })
  .max(REFERRAL_CODE_MAX, { message: "Referral codes are at most 32 characters" })
  .regex(/^[A-Za-z0-9-]+$/, {
    message: "Use only letters, numbers and dashes in a referral code",
  });

export type ReferralCodeResult =
  | { status: "valid"; code: string }
  | { status: "invalid"; message: string };

/** Validate a typed referral code and return it in its canonical (uppercase) form. */
export function normalizeReferralCode(raw: string): ReferralCodeResult {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") {
    return { status: "invalid", message: "Enter a referral code" };
  }
  const parsed = referralCodeSchema.safeParse(trimmed);
  if (!parsed.success) {
    return {
      status: "invalid",
      message: parsed.error.issues[0]?.message ?? "Invalid referral code",
    };
  }
  return { status: "valid", code: parsed.data.toUpperCase() };
}
