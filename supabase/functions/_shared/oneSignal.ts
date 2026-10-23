// Sends a push via OneSignal to Supabase user ids (OneSignal external ids).
// `data.path` is read by the app's click listener to open the right screen.
// Returns the recipient count (0 on any error or missing configuration).
export async function sendPush(
  externalUserIds: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<number> {
  const appId = Deno.env.get("ONESIGNAL_APP_ID");
  const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  if (!appId || !apiKey || !externalUserIds.length) return 0;
  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${apiKey}` },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: externalUserIds,
        headings: { en: title },
        contents: { en: body },
        data,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.errors?.length) {
      console.error("[OneSignal] Error:", result.errors || result);
      return 0;
    }
    return result.recipients || 0;
  } catch (error) {
    console.error("[OneSignal] Fetch error:", (error as Error).message);
    return 0;
  }
}
