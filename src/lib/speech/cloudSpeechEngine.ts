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
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentAbort: AbortController | null = null;
let glowTimer: ReturnType<typeof setInterval> | null = null;

const ctx = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
};

const clearGlowTimer = () => {
  if (glowTimer) clearInterval(glowTimer);
  glowTimer = null;
};

async function fetchChunkAudio(
  text: string,
  voiceId: string,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in to use read aloud.");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/read-aloud`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice: voiceId }),
    signal,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Speech request failed (${res.status})`);
  }
  const bytes = await res.arrayBuffer();
  return await ctx().decodeAudioData(bytes);
}

export const cloudSpeechEngine: SpeechEngine = {
  isSupported: () => typeof window !== "undefined" && typeof AudioContext !== "undefined",

  getVoices: () => Promise.resolve(VOICES),

  pickDefaultVoice: () => "female",

  speak(words, fromIndex, opts, cb) {
    this.stop();
    const gen = ++generation;
    const chunks = buildChunks(words, fromIndex);
    if (!chunks.length) return cb.onEnd();
    const voiceId = opts.voiceId === "male" ? "male" : "female";
    const rate = opts.rate || 1;

    const buffers: (AudioBuffer | null)[] = new Array(chunks.length).fill(null);
    const abort = new AbortController();
    currentAbort = abort;

    const prefetch = (k: number) => {
      if (k >= chunks.length || buffers[k]) return;
      fetchChunkAudio(chunks[k].text, voiceId, abort.signal)
        .then((buf) => {
          buffers[k] = buf;
        })
        .catch(() => {
          /* handled when the chunk is needed */
        });
    };

    const playChunk = async (k: number) => {
      if (gen !== generation) return;
      const chunk = chunks[k];
      let buffer = buffers[k];
      if (!buffer) {
        try {
          buffer = await fetchChunkAudio(chunk.text, voiceId, abort.signal);
          buffers[k] = buffer;
        } catch (err) {
          if (gen !== generation || abort.signal.aborted) return;
          cb.onError(err instanceof Error ? err.message : "The voice stopped unexpectedly. Tap play to continue.");
          return;
        }
      }
      if (gen !== generation) return;
      prefetch(k + 1);

      const context = ctx();
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(context.destination);
      currentSource = source;

      // Distribute the chunk's real duration across its words by length,
      // so the glow follows the voice closely.
      const weights = chunk.wordIdx.map((wi) => spokenForm(words[wi]).length + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const durationMs = (buffer.duration / rate) * 1000;
      const startMs = performance.now();
      cb.onWord(chunk.wordIdx[0]);

      clearGlowTimer();
      let last = 0;
      glowTimer = setInterval(() => {
        if (gen !== generation) return;
        const elapsed = performance.now() - startMs;
        let acc = 0;
        let j = last;
        for (let i = 0; i < weights.length; i++) {
          acc += (weights[i] / totalWeight) * durationMs;
          if (elapsed < acc) {
            j = i;
            break;
          }
          j = i;
        }
        if (j !== last) {
          last = j;
          cb.onWord(chunk.wordIdx[j]);
        }
      }, 60);

      source.onended = () => {
        if (gen !== generation) return;
        clearGlowTimer();
        if (k + 1 < chunks.length) void playChunk(k + 1);
        else cb.onEnd();
      };
      source.start();
    };

    void playChunk(0);
  },

  stop() {
    generation++;
    clearGlowTimer();
    currentAbort?.abort();
    currentAbort = null;
    try {
      currentSource?.stop();
    } catch {
      /* already stopped */
    }
    currentSource = null;
  },
};
