import { expect, test } from "bun:test";
import { publicDonorIdentity } from "../../supabase/functions/_shared/donorIdentity.ts";
test("non-anonymous donors show their full profile name", () => {
  expect(publicDonorIdentity({ display_name: "John Michael Smith", username: "john123", donor_anonymous: false }).username).toBe("John Michael Smith");
});
test("anonymous donors reveal neither name nor photo", () => {
  expect(publicDonorIdentity({ display_name: "John Michael Smith", username: "john123", profile_picture_url: "/private-photo", donor_anonymous: true })).toEqual({ username: "Anonymous Donor", profile_picture_url: null });
});
test("missing full names fall back to the saved username", () => {
  expect(publicDonorIdentity({ display_name: " ", username: "john123", donor_anonymous: false }).username).toBe("john123");
});