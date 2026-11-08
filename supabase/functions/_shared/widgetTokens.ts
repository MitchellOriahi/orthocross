// Read-only home screen widget keys. Only a SHA-256 hash is stored, so a leaked
// database row cannot be replayed; the raw key lives on the device.
export const WIDGET_TOKEN_PREFIX = "ocw_";

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function generateWidgetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return WIDGET_TOKEN_PREFIX + toBase64Url(bytes);
}

export function isWidgetTokenShape(value: string): boolean {
  return /^ocw_[A-Za-z0-9_-]{43}$/.test(value);
}

export async function hashWidgetToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
