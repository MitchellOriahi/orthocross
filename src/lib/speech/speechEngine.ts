/**
 * Replaceable speech engine. The glow logic only depends on the SpeechEngine
 * interface: give it a list of words and a start index, and it reports which
 * word is being spoken. Swap `webSpeechEngine` for a timestamp-based service
 * (ElevenLabs, OpenAI TTS…) by implementing the same interface.
 */
export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
}

export interface SpeakOptions {
  voiceId?: string | null;
  rate: number;
}

export interface SpeechCallbacks {
  onWord: (index: number) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

export interface SpeechEngine {
  isSupported(): boolean;
  getVoices(): Promise<VoiceOption[]>;
  pickDefaultVoice(voices: VoiceOption[]): string | null;
  speak(words: string[], fromIndex: number, opts: SpeakOptions, cb: SpeechCallbacks): void;
  stop(): void;
}

/** Text that should actually be voiced for a word (drops footnote markers). */
export const spokenForm = (word: string) =>
  word.replace(/\[[^\]]*\]/g, "").replace(/[*†‡¶§]/g, "").trim();

interface Chunk {
  text: string;
  offsets: number[]; // char offset of each word in text
  wordIdx: number[]; // global word index of each word
}

const SENTENCE_END = /[.!?;:]["'”’)\]]*$/;
const MAX_CHUNK_CHARS = 220;

export function buildChunks(words: string[], from: number): Chunk[] {
  const chunks: Chunk[] = [];
  let cur: Chunk = { text: "", offsets: [], wordIdx: [] };
  for (let i = Math.max(0, from); i < words.length; i++) {
    const s = spokenForm(words[i]);
    if (!s) continue;
    if (cur.text) cur.text += " ";
    cur.offsets.push(cur.text.length);
    cur.wordIdx.push(i);
    cur.text += s;
    if ((SENTENCE_END.test(s) && cur.text.length > 40) || cur.text.length > MAX_CHUNK_CHARS) {
      chunks.push(cur);
      cur = { text: "", offsets: [], wordIdx: [] };
    }
  }
  if (cur.text) chunks.push(cur);
  return chunks;
}

const PREFERRED = [/samantha/i, /daniel/i, /google us english/i, /karen/i, /moira/i, /serena/i, /aria/i, /jenny/i, /natural/i];

const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : undefined);

let generation = 0;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
const clearFallback = () => {
  if (fallbackTimer) clearTimeout(fallbackTimer);
  fallbackTimer = null;
};

export const webSpeechEngine: SpeechEngine = {
  isSupported: () => !!synth() && typeof SpeechSynthesisUtterance !== "undefined",

  getVoices() {
    const s = synth();
    if (!s) return Promise.resolve([]);
    const map = () =>
      s.getVoices().map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang }));
    const now = map();
    if (now.length) return Promise.resolve(now);
    return new Promise((resolve) => {
      const done = () => {
        s.removeEventListener("voiceschanged", done);
        resolve(map());
      };
      s.addEventListener("voiceschanged", done);
      setTimeout(done, 1500);
    });
  },

  pickDefaultVoice(voices) {
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    for (const re of PREFERRED) {
      const hit = en.find((v) => re.test(v.name));
      if (hit) return hit.id;
    }
    return (en[0] ?? voices[0])?.id ?? null;
  },

  speak(words, fromIndex, opts, cb) {
    const s = synth();
    if (!s) return cb.onError("Speech is not supported on this device.");
    this.stop();
    const gen = ++generation;
    const chunks = buildChunks(words, fromIndex);
    if (!chunks.length) return cb.onEnd();
    const voice = s.getVoices().find((v) => v.voiceURI === opts.voiceId) ?? null;

    const speakChunk = (k: number) => {
      if (gen !== generation) return;
      const chunk = chunks[k];
      const u = new SpeechSynthesisUtterance(chunk.text);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = opts.rate;
      let boundarySeen = false;
      let last = 0;
      cb.onWord(chunk.wordIdx[0]);

      // Fallback: estimate timing when the browser sends no boundary events.
      const runTimer = (j: number) => {
        if (gen !== generation || boundarySeen || j >= chunk.wordIdx.length - 1) return;
        const len = spokenForm(words[chunk.wordIdx[j]]).length;
        const ms = (len * 62 + 140) / opts.rate;
        fallbackTimer = setTimeout(() => {
          if (gen !== generation || boundarySeen) return;
          last = j + 1;
          cb.onWord(chunk.wordIdx[last]);
          runTimer(last);
        }, ms);
      };
      clearFallback();
      fallbackTimer = setTimeout(() => {
        if (!boundarySeen) runTimer(0);
      }, 700 / opts.rate);

      u.onboundary = (e) => {
        if (gen !== generation) return;
        if (e.name && e.name !== "word") return;
        boundarySeen = true;
        clearFallback();
        let j = last;
        while (j + 1 < chunk.offsets.length && chunk.offsets[j + 1] <= e.charIndex) j++;
        last = j;
        cb.onWord(chunk.wordIdx[j]);
      };
      u.onend = () => {
        if (gen !== generation) return;
        clearFallback();
        if (k + 1 < chunks.length) speakChunk(k + 1);
        else cb.onEnd();
      };
      u.onerror = (e) => {
        if (gen !== generation) return;
        if (e.error === "interrupted" || e.error === "canceled") return;
        clearFallback();
        cb.onError("The voice stopped unexpectedly. Tap play to continue.");
      };
      s.speak(u);
    };

    // Chrome sometimes ignores speak() immediately after cancel().
    setTimeout(() => speakChunk(0), 60);
  },

  stop() {
    generation++;
    clearFallback();
    synth()?.cancel();
  },
};

// The app reads scripture aloud with the cloud engine's soothing voices.
// The device engine stays available here as a drop-in replacement.
export { cloudSpeechEngine as speechEngine } from "./cloudSpeechEngine";
