import { expect, test } from "bun:test";
import { notifyDonationFriends } from "../../supabase/functions/_shared/friendDonationNotifications.ts";

const donationId = "00000000-0000-4000-8000-000000000001";
const notification = { id: "00000000-0000-4000-8000-000000000002", recipient_id: "friend-id", donor_name: "John Smith" };
function adminFor(rows: unknown[]) {
  const updates: string[] = [];
  return {
    updates,
    rpc: async (name: string, args: unknown) => {
      expect(name).toBe("queue_friend_donation_notifications");
      expect(args).toEqual({ p_donation_id: donationId });
      return { data: rows, error: null };
    },
    from: () => ({ update: () => ({ eq: async (_: string, id: string) => {
      updates.push(id); return { error: null };
    } }) }),
  };
}
test("anonymous donations with no queued recipients never send a friend push", async () => {
  let calls = 0;
  await notifyDonationFriends(adminFor([]), donationId, { appId: "app", apiKey: "test" },
    (async () => { calls++; return new Response("{}"); }) as typeof fetch);
  expect(calls).toBe(0);
});
test("a public donation alerts its queued friend without disclosing amounts", async () => {
  let payload: any;
  const admin = adminFor([notification]);
  await notifyDonationFriends(admin, donationId, { appId: "app", apiKey: "test" },
    (async (_url, init) => { payload = JSON.parse(String(init?.body)); return new Response('{"id":"sent"}'); }) as typeof fetch);
  expect(payload.include_external_user_ids).toEqual(["friend-id"]);
  expect(payload.contents.en).toContain("John Smith");
  expect(payload).not.toHaveProperty("amount");
  expect(payload.contents.en).not.toContain("$");
  expect(admin.updates).toEqual([notification.id]);
});
test("retries reuse the alert UUID so push delivery is idempotent", async () => {
  const keys: string[] = [];
  const send = (async (_url, init) => {
    keys.push(JSON.parse(String(init?.body)).idempotency_key);
    return new Response('{"id":"sent"}');
  }) as typeof fetch;
  await notifyDonationFriends(adminFor([notification]), donationId, { appId: "app", apiKey: "test" }, send);
  await notifyDonationFriends(adminFor([notification]), donationId, { appId: "app", apiKey: "test" }, send);
  expect(keys).toEqual([notification.id, notification.id]);
});
test("failed push delivery remains unmarked and retryable", async () => {
  const admin = adminFor([notification]);
  await expect(notifyDonationFriends(admin, donationId, { appId: "app", apiKey: "test" },
    (async () => new Response("provider unavailable", { status: 503 })) as typeof fetch)).rejects.toThrow("503");
  expect(admin.updates).toEqual([]);
});