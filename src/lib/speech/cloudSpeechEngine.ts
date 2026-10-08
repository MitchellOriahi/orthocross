/**
 * Cloud speech engine: soothing male/female voices rendered server-side.
 * Implements the same SpeechEngine interface as the device engine, so the
 * word-by-word glow, tap-to-seek, pause and speed controls all keep working.
 * Word timing is estimated from each chunk's real audio duration, so the
 * glow tracks the voice far more closely than a fixed per-word guess.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  buildChunks,
  spokenForm,
  type SpeechEngine,
  type VoiceOption,
} from "./speechEngine";

const VOICES: VoiceOption[] = [
  { id: "female", name: "Mary — soft female", lang: "en" },
  { id: "male", name: "Mark — warm male", lang: "en" },
];

let generation = 0;
let audioEl: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
let glowTimer: ReturnType<typeof setInterval> | null = null;
let currentUrl: string | null = null;

// Tiny silent WAV used to unlock playback inside the user's tap (iOS/Safari).
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

// A media element (not Web Audio) so sound plays even with the phone's silent switch on.
const player = () => {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
    audioEl.setAttribute("playsinline", "true");
  }
  return audioEl;
};

const clearGlowTimer = () => {
  if (glowTimer) clearInterval(glowTimer);
  glowTimer = null;
};

async function fetchChunkAudio(text: string, voiceId: string, signal: AbortSignal): Promise<Blob> {
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
    if (res.status === 401) throw new Error("Please sign in to use read aloud.");
    throw new Error("The voice couldn't be prepared. Tap play to try again.");
  }
  return new Blob([await res.arrayBuffer()], { type: "audio/wav" });
}

export const cloudSpeechEngine: SpeechEngine = {
  isSupported: () => typeof window !== "undefined" && typeof Audio !== "undefined",

  getVoices: () => Promise.resolve(VOICES),

  pickDefaultVoice: () => "female",

  speak(words, fromIndex, opts, cb) {
    this.stop();
    const gen = ++generation;
    const chunks = buildChunks(words, fromIndex);
    if (!chunks.length) return cb.onEnd();
    const voiceId = opts.voiceId === "male" ? "male" : "female";
    const rate = opts.rate || 1;

    // Unlock audio synchronously while still inside the tap.
    const el = player();
    try {
      el.src = SILENT_WAV;
      void el.play().catch(() => {});
    } catch { /* ignore */ }

    const blobs: (Promise<Blob> | null)[] = new Array(chunks.length).fill(null);
    const abort = new AbortController();
    currentAbort = abort;
    const get = (k: number) => {
      if (!blobs[k]) {
        blobs[k] = fetchChunkAudio(chunks[k].text, voiceId, abort.signal);
        blobs[k]!.catch(() => {});
      }
      return blobs[k]!;
    };

    const playChunk = async (k: number) => {
      if (gen !== generation) return;
      const chunk = chunks[k];
      let blob: Blob;
      try {
        blob = await get(k);
      } catch (err) {
        if (gen !== generation || abort.signal.aborted) return;
        cb.onError(err instanceof Error ? err.message : "The voice stopped unexpectedly. Tap play to continue.");
        return;
      }
      if (gen !== generation) return;
      if (k + 1 < chunks.length) void get(k + 1);

      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = URL.createObjectURL(blob);
      el.onended = null;
      el.src = currentUrl;
      el.playbackRate = rate;
      const weights = chunk.wordIdx.map((wi) => spokenForm(words[wi]).length + 1);
      const totalWeight = weights.reduce((x, y) => x + y, 0);
      cb.onWord(chunk.wordIdx[0]);
      let last = 0;
      clearGlowTimer();
      glowTimer = setInterval(() => {
        if (gen !== generation) return;
        const dur = el.duration;
        if (!dur || !isFinite(dur)) return;
        const t = el.currentTime;
        let acc = 0;
        let j = weights.length - 1;
        for (let i = 0; i < weights.length; i++) {
          acc += (weights[i] / totalWeight) * dur;
          if (t < acc) { j = i; break; }
        }
        if (j !== last) { last = j; cb.onWord(chunk.wordIdx[j]); }
      }, 50);
      el.onended = () => {
        if (gen !== generation) return;
        clearGlowTimer();
        if (k + 1 < chunks.length) void playChunk(k + 1);
        else cb.onEnd();
      };
      try {
        await el.play();
      } catch {
        if (gen !== generation) return;
        clearGlowTimer();
        cb.onError("Your device blocked the sound. Tap play again.");
      }
    };

    void playChunk(0);
  },

  stop() {
    generation++;
    clearGlowTimer();
    currentAbort?.abort();
    currentAbort = null;
    if (audioEl) {
      audioEl.onended = null;
      audioEl.pause();
    }
  },
};
