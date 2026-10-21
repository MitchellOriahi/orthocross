/**
 * Cloud speech engine: soothing male/female voices rendered server-side.
 * Implements the same SpeechEngine interface as the device engine, so the
 * word-by-word glow, tap-to-seek, pause and speed controls all keep working.
 * Word timing is estimated from each chunk's audible regions and media clock;
 * Gemini WAV does not provide exact per-word alignment timestamps.
 *
 * Speed: the first chunk is short so the voice starts quickly, later chunks
 * are prepared several steps ahead on a second, preloaded audio element, and
 * the silence the voice service adds at each chunk's edges is trimmed so
 * verses flow into each other without a pause, even at faster speeds.
 */
import { supabase } from "@/integrations/supabase/client";
import { buildWordTimeline, wordAtTime, type AudioWindow } from "./wordTiming";
import { clearSpeechServicePause, pauseSpeechService, speechServiceError } from "./speechServiceState";
import {
  buildChunks,
  spokenForm,
  type Chunk,
  type ChunkSizing,
  type SpeechEngine,
  type VoiceOption,
} from "./speechEngine";

const VOICES: VoiceOption[] = [
  { id: "female", name: "Sylvia — female voice", lang: "en" },
  { id: "male", name: "Peter — male voice", lang: "en" },
];

// Short opening chunk = faster first sound; longer later chunks = fewer seams.
const FIRST_SIZING: ChunkSizing = { target: 24, soft: 55, max: 110 };
const REST_SIZING: ChunkSizing = { target: 220, soft: 380, max: 460 };
const LOOKAHEAD = 3;

let generation = 0;
const players: HTMLAudioElement[] = [];
let currentAbort: AbortController | null = null;
let glowTimer: ReturnType<typeof setInterval> | null = null;
let liveUrls: string[] = [];
let playbackRate = 1;

// Tiny silent WAV used to unlock playback inside the user's tap (iOS/Safari).
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

// Media elements (not Web Audio) so sound plays even with the phone's silent switch on.
// Two of them: one plays while the other preloads the next chunk.
const player = (i: number) => {
  if (!players[i]) {
    const a = new Audio();
    a.preload = "auto";
    a.setAttribute("playsinline", "true");
    players[i] = a;
  }
  return players[i];
};

const clearGlowTimer = () => {
  if (glowTimer) clearInterval(glowTimer);
  glowTimer = null;
};

interface Prepared {
  blob: Blob;
  duration: number | null;
  windows?: AudioWindow[];
}

// ---------- WAV silence trimming ----------
const SILENCE = 500; // 16-bit amplitude treated as silence (~ -36 dB)
const KEEP_LEAD = 0.02; // seconds kept before the first sound
const KEEP_TAIL = 0.07; // seconds kept after the last sound

export function trimWav(buf: ArrayBuffer): Prepared {
  const fallback = { blob: new Blob([buf], { type: "audio/wav" }), duration: null };
  try {
    const v = new DataView(buf);
    const tag = (o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
    if (buf.byteLength < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") return fallback;
    let o = 12;
    let fmt: { format: number; channels: number; rate: number; bits: number } | null = null;
    let dataStart = -1;
    let dataLen = 0;
    while (o + 8 <= buf.byteLength) {
      const id = tag(o);
      const size = v.getUint32(o + 4, true);
      if (id === "fmt ") {
        fmt = {
          format: v.getUint16(o + 8, true),
          channels: v.getUint16(o + 10, true),
          rate: v.getUint32(o + 12, true),
          bits: v.getUint16(o + 22, true),
        };
      } else if (id === "data") {
        dataStart = o + 8;
        dataLen = Math.min(size, buf.byteLength - dataStart);
        if (!size || size === 0xffffffff) dataLen = buf.byteLength - dataStart;
        break;
      }
      o += 8 + size + (size % 2);
    }
    if (!fmt || dataStart < 0 || fmt.format !== 1 || fmt.bits !== 16 || !fmt.channels) return fallback;
    const frameBytes = 2 * fmt.channels;
    const frames = Math.floor(dataLen / frameBytes);
    if (!frames) return fallback;
    const channels = fmt.channels;
    const loud = (f: number) => {
      for (let c = 0; c < channels; c++) {
        if (Math.abs(v.getInt16(dataStart + f * frameBytes + c * 2, true)) > SILENCE) return true;
      }
      return false;
    };
    let first = 0;
    while (first < frames && !loud(first)) first++;
    if (first >= frames) return fallback;
    let last = frames - 1;
    while (last > first && !loud(last)) last--;
    const start = Math.max(0, first - Math.round(KEEP_LEAD * fmt.rate));
    const end = Math.min(frames, last + 1 + Math.round(KEEP_TAIL * fmt.rate));
    // Measure 10ms frames, keeping brief consonant gaps inside speech. Only
    // sustained silence (>=100ms) is excluded from the word-time budget.
    const hop = Math.max(1, Math.round(fmt.rate * 0.01));
    const windows: AudioWindow[] = [];
    for (let f = start; f < end; f += hop) {
      const limit = Math.min(end, f + hop);
      let active = false;
      for (let n = f; n < limit; n++) if (loud(n)) { active = true; break; }
      const previous = windows[windows.length - 1];
      if (previous?.active === active) previous.end = (limit - start) / fmt.rate;
      else windows.push({ start: (f - start) / fmt.rate, end: (limit - start) / fmt.rate, active });
    }
    for (let i = 1; i < windows.length - 1; i++) {
      const w = windows[i];
      if (!w.active && w.end - w.start < 0.1) w.active = true;
    }
    const pcmLen = (end - start) * frameBytes;
    const out = new ArrayBuffer(44 + pcmLen);
    const w = new DataView(out);
    const put = (p: number, s: string) => { for (let i = 0; i < 4; i++) w.setUint8(p + i, s.charCodeAt(i)); };
    put(0, "RIFF"); w.setUint32(4, 36 + pcmLen, true); put(8, "WAVE");
    put(12, "fmt "); w.setUint32(16, 16, true); w.setUint16(20, 1, true);
    w.setUint16(22, fmt.channels, true); w.setUint32(24, fmt.rate, true);
    w.setUint32(28, fmt.rate * frameBytes, true); w.setUint16(32, frameBytes, true); w.setUint16(34, 16, true);
    put(36, "data"); w.setUint32(40, pcmLen, true);
    new Uint8Array(out, 44).set(new Uint8Array(buf, dataStart + start * frameBytes, pcmLen));
    return { blob: new Blob([out], { type: "audio/wav" }), duration: (end - start) / fmt.rate, windows };
  } catch {
    return fallback;
  }
}

// Saved-on-device audio: once a section is generated it is kept across app
// restarts, so re-listening never waits on the network again.
const DISK_CACHE = "read-aloud-v1";
const diskUrl = (text: string, voiceId: string) =>
  `https://read-aloud.local/${encodeURIComponent(voiceId)}/${encodeURIComponent(text)}`;

async function diskGet(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  try {
    if (typeof caches === "undefined") return null;
    const res = await (await caches.open(DISK_CACHE)).match(diskUrl(text, voiceId));
    return res ? await res.arrayBuffer() : null;
  } catch { return null; }
}

function diskPut(text: string, voiceId: string, buf: ArrayBuffer) {
  try {
    if (typeof caches === "undefined") return;
    void caches.open(DISK_CACHE)
      .then((c) => c.put(diskUrl(text, voiceId), new Response(buf, { headers: { "Content-Type": "audio/wav" } })))
      .catch(() => {});
  } catch { /* storage unavailable */ }
}

async function fetchChunkAudio(text: string, voiceId: string, signal: AbortSignal): Promise<Prepared> {
  const saved = await diskGet(text, voiceId);
  if (saved) return trimWav(saved);
  const blocked = speechServiceError();
  if (blocked) throw new Error(blocked);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in to use read aloud.");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/read-aloud`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: voiceId }),
    signal,
  });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const blockedMessage = pauseSpeechService(res.status, body);
    if (blockedMessage) throw new Error(blockedMessage);
    if (res.status === 401) throw new Error("Please sign in to use read aloud.");
    throw new Error("The voice couldn't be prepared. Tap play to try again.");
  }
  const buf = await res.arrayBuffer();
  clearSpeechServicePause();
  diskPut(text, voiceId, buf.slice(0));
  return trimWav(buf);
}

// Cache of prepared chunk audio so replays, re-seeks, resumes and the next
// chunk start instantly instead of waiting for the server again.
const audioCache = new Map<string, Promise<Prepared>>();
const CACHE_LIMIT = 80;
const cacheKey = (text: string, voiceId: string) => `${voiceId}|${text}`;

function cachedAudio(text: string, voiceId: string, signal?: AbortSignal) {
  const key = cacheKey(text, voiceId);
  const hit = audioCache.get(key);
  if (hit) return hit;
  // Background requests are never cancelled, so the work is never wasted.
  const p = fetchChunkAudio(text, voiceId, signal ?? new AbortController().signal);
  audioCache.set(key, p);
  p.catch(() => audioCache.delete(key));
  if (audioCache.size > CACHE_LIMIT) {
    const oldest = audioCache.keys().next().value;
    if (oldest !== undefined) audioCache.delete(oldest);
  }
  return p;
}

const chapterChunks = (words: string[]) => buildChunks(words, 0, REST_SIZING, FIRST_SIZING);

/** Prepares the chapter's first audio chunks in the background, before Play. */
export function prefetchSpeech(words: string[], voiceId: string) {
  if (speechServiceError()) return;
  // Sequential warmup stops on the first failure rather than issuing a burst
  // of billed requests when credits/access are unavailable.
  void (async () => {
    for (const c of chapterChunks(words).slice(0, 4)) {
      if (speechServiceError()) return;
      await cachedAudio(c.text, voiceId);
    }
  })().catch(() => {});
}

/**
 * Picks where playback begins. Uses the chapter's own chunks (already
 * prepared) when possible, starting mid-chunk at the tapped word; otherwise
 * builds fresh chunks that start exactly at the word with a short opener.
 */
function plan(words: string[], fromIndex: number, voiceId: string): { chunks: Chunk[]; startWord: number } {
  const canonical = chapterChunks(words);
  const k = canonical.findIndex((c) => c.wordIdx[c.wordIdx.length - 1] >= fromIndex);
  if (k < 0) return { chunks: [], startWord: 0 };
  const c = canonical[k];
  const j = Math.max(0, c.wordIdx.findIndex((wi) => wi >= fromIndex));
  if (j === 0 || audioCache.has(cacheKey(c.text, voiceId))) {
    return { chunks: canonical.slice(k), startWord: j };
  }
  return { chunks: buildChunks(words, fromIndex, REST_SIZING, FIRST_SIZING), startWord: 0 };
}

export const cloudSpeechEngine: SpeechEngine = {
  isSupported: () => typeof window !== "undefined" && typeof Audio !== "undefined",

  getVoices: () => Promise.resolve(VOICES),

  pickDefaultVoice: () => "female",

  speak(words, fromIndex, opts, cb) {
    this.stop();
    const gen = ++generation;
    const voiceId = opts.voiceId === "male" ? "male" : "female";
    const { chunks, startWord } = plan(words, fromIndex, voiceId);
    if (!chunks.length) return cb.onEnd();
    playbackRate = opts.rate || 1;

    // Unlock both audio elements synchronously while still inside the tap.
    for (const i of [0, 1]) {
      const el = player(i);
      try {
        el.src = SILENT_WAV;
        void el.play().catch(() => {});
      } catch { /* ignore */ }
    }

    const abort = new AbortController();
    currentAbort = abort;
    const ready: (Promise<Prepared> | null)[] = new Array(chunks.length).fill(null);
    const urls: (string | null)[] = new Array(chunks.length).fill(null);
    const get = (k: number) => {
      const existing = ready[k];
      if (existing) return existing;
      const pending = cachedAudio(chunks[k].text, voiceId, k === 0 ? abort.signal : undefined);
      ready[k] = pending;
      pending.catch(() => {});
      return pending;
    };
    const urlFor = (k: number, p: Prepared) => {
      const existing = urls[k];
      if (existing) return existing;
      const url = URL.createObjectURL(p.blob);
      urls[k] = url;
      liveUrls.push(url);
      return url;
    };
    const elFor = (k: number) => player(k % 2);

    // Load the next chunk into the idle element so it can start the instant
    // the current one ends.
    const preload = (k: number) => {
      if (k >= chunks.length) return;
      get(k).then((p) => {
        if (gen !== generation) return;
        const el = elFor(k);
        const url = urlFor(k, p);
        if (el.src !== url && el.paused) {
          el.src = url;
          el.load();
        }
      }).catch(() => {});
    };

    const playChunk = async (k: number, startAt: number) => {
      if (gen !== generation) return;
      const chunk = chunks[k];
      let prepared: Prepared;
      try {
        prepared = await get(k);
      } catch (err) {
        if (gen !== generation || abort.signal.aborted) return;
        cb.onError(err instanceof Error ? err.message : "The voice stopped unexpectedly. Tap play to continue.");
        return;
      }
      if (gen !== generation) return;
      void (async () => {
        for (let n = 1; n <= LOOKAHEAD; n++) {
          if (gen !== generation || speechServiceError()) return;
          if (k + n < chunks.length) await get(k + n);
        }
      })().catch(() => {});

      const el = elFor(k);
      const url = urlFor(k, prepared);
      el.onended = null;
      if (el.src !== url) el.src = url;
      el.defaultPlaybackRate = playbackRate;
      el.playbackRate = playbackRate;

      const duration = () => prepared.duration ?? (isFinite(el.duration) ? el.duration : 0);
      let starts = buildWordTimeline(chunk.wordIdx.map((wi) => spokenForm(words[wi])), duration(), prepared.windows);
      const timeOfWord = (j: number) => {
        if (!starts.length) starts = buildWordTimeline(chunk.wordIdx.map((wi) => spokenForm(words[wi])), duration(), prepared.windows);
        return starts[j] ?? 0;
      };

      if (startAt > 0) {
        const seekTo = () => { try { el.currentTime = timeOfWord(startAt); } catch { /* ignore */ } };
        if (el.readyState >= 1 && duration()) seekTo();
        else el.onloadedmetadata = () => { if (gen === generation) seekTo(); };
      } else if (el.currentTime) {
        try { el.currentTime = 0; } catch { /* ignore */ }
      }

      let last = -1;
      clearGlowTimer();
      const syncGlow = () => {
        if (gen !== generation || el.paused || el.seeking || el.readyState < 3) return;
        timeOfWord(0);
        const j = wordAtTime(starts, el.currentTime);
        if (j !== last && j >= 0) { last = j; cb.onWord(chunk.wordIdx[j]); }
      };
      el.onplaying = syncGlow;
      el.ontimeupdate = syncGlow;
      el.onseeked = syncGlow;
      glowTimer = setInterval(syncGlow, 20);
      el.onended = () => {
        if (gen !== generation) return;
        clearGlowTimer();
        if (k + 1 < chunks.length) void playChunk(k + 1, 0);
        else cb.onEnd();
      };
      try {
        await el.play();
        preload(k + 1);
      } catch {
        if (gen !== generation) return;
        clearGlowTimer();
        cb.onError("Your device blocked the sound. Tap play again.");
      }
    };

    void playChunk(0, startWord);
  },

  setRate(rate) {
    if (!Number.isFinite(rate) || rate <= 0) return;
    playbackRate = rate;
    for (const el of players) {
      el.defaultPlaybackRate = rate;
      el.playbackRate = rate;
    }
  },

  stop() {
    generation++;
    clearGlowTimer();
    currentAbort?.abort();
    currentAbort = null;
    for (const el of players) {
      if (!el) continue;
      el.onended = null;
      el.onloadedmetadata = null;
      el.onplaying = null;
      el.ontimeupdate = null;
      el.onseeked = null;
      el.pause();
    }
    for (const u of liveUrls) URL.revokeObjectURL(u);
    liveUrls = [];
  },
};
