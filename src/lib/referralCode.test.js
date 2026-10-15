import { describe, expect, test } from "bun:test";
import { normalizeReferralCode, REFERRAL_CODE_MAX } from "./referralCode";

describe("referral code entry", () => {
  test("accepts a normal code and stores it uppercase", () => {
    expect(normalizeReferralCode("  ortho-cross9 ")).toEqual({ ok: true, code: "ORTHO-CROSS9" });
  });

  test("rejects an empty code", () => {
    const result = normalizeReferralCode("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Enter a referral code");
  });

  test("rejects a code that is too short", () => {
    const result = normalizeReferralCode("ab");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("at least 3");
  });

  test("rejects a code longer than 32 characters", () => {
    const result = normalizeReferralCode("A".repeat(REFERRAL_CODE_MAX + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("at most 32");
  });

  test("rejects symbols that are not dashes", () => {
    for (const bad of ["code!", "code name", "code<script>", "code_1"]) {
      const result = normalizeReferralCode(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toContain("letters, numbers and dashes");
    }
  });
});
