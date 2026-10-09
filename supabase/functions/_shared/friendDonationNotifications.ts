// Only the service-role queue chooses recipients and releases donor identity.
export async function notifyDonationFriends(
  admin: any, donationId: string,
  config: { appId?: string; apiKey?: string }, send: typeof fetch = fetch,
) {
  const { data: notifications, error } = await admin.rpc("queue_friend_donation_notifications", { p_donation_id: donationId });
  if (error) throw error;
  if (!config.appId || !config.apiKey) return;
  await Promise.all((notifications ?? []).map(async (n: { id: string; recipient_id: string; donor_name: string }) => {
    const response = await send("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${config.apiKey}` },
      body: JSON.stringify({
        app_id: config.appId, include_external_user_ids: [n.recipient_id], idempotency_key: n.id,
        headings: { en: "A friend supported OrthoCross ☦" },
        contents: { en: `${n.donor_name} made a donation to OrthoCross. May God bless their generosity!` },
        data: { path: "/friends" },
      }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Donation notification failed [${response.status}]: ${body}`);
    const result = JSON.parse(body);
    if (result.errors) throw new Error(`Donation notification failed: ${JSON.stringify(result.errors)}`);
    const { error: updateError } = await admin.from("friend_donation_notifications")
      .update({ push_sent_at: new Date().toISOString() }).eq("id", n.id);
    if (updateError) throw updateError;
  }));
}