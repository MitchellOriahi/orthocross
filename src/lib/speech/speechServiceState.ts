const STORAGE_KEY = "readAloudServicePaused";
let pausedMessage: string | null = null;

export function speechServiceError(): string | null {
  try { return pausedMessage ?? localStorage.getItem(STORAGE_KEY); }
  catch { return pausedMessage; }
}

/** Terminal service failures pause all new requests, including prefetch. */
export function pauseSpeechService(status: number, body: unknown): string | null {
  if (status !== 402 && status !== 403) return null;
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  let details: Record<string, unknown> = data;
  if (typeof data.details === "string") {
    try { details = JSON.parse(data.details); } catch { /* use safe fallback */ }
  }
  const reason = typeof details.message === "string" ? details.message : "";
  pausedMessage = status === 402
    ? "Read-aloud is temporarily unavailable: not enough AI credits. The app owner needs to top up AI credits. You can still read normally."
    : `Read-aloud is temporarily unavailable${reason ? `: ${reason}` : ". Service access needs to be restored"}. You can still read normally.`;
  try { localStorage.setItem(STORAGE_KEY, pausedMessage); } catch { /* memory still pauses requests */ }
  return pausedMessage;
}