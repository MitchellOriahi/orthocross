const STORAGE_KEY = "readAloudServicePaused";
// A pause is a cooldown, not a permanent off-switch: after this long the
// service is tried again, so topping up credits or a restored connection
// brings read-aloud back without any manual reset.
const COOLDOWN_MS = 30 * 60 * 1000;

let pausedMessage: string | null = null;
let pausedAt = 0;

interface StoredPause {
  message: string;
  at: number;
}

function readStored(): StoredPause | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed && typeof parsed === "object" &&
      typeof (parsed as StoredPause).message === "string" &&
      typeof (parsed as StoredPause).at === "number"
    ) {
      return parsed as StoredPause;
    }
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch { return null; }
}

export function speechServiceError(): string | null {
  const stored = pausedMessage ? { message: pausedMessage, at: pausedAt } : readStored();
  if (!stored) return null;
  if (Date.now() - stored.at >= COOLDOWN_MS) {
    clearSpeechServicePause();
    return null;
  }
  return stored.message;
}

/** A successful request proves the service is back; lift the pause. */
export function clearSpeechServicePause(): void {
  pausedMessage = null;
  pausedAt = 0;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* memory still cleared */ }
}

/** Terminal service failures pause new requests, including prefetch, for a cooldown. */
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
  pausedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ message: pausedMessage, at: pausedAt } satisfies StoredPause));
  } catch { /* memory still pauses requests */ }
  return pausedMessage;
}
