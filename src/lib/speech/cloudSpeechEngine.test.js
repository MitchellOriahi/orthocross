import { test, expect, mock } from "bun:test";
mock.module("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test-only" } } }) } } }));
const { trimWav, cloudSpeechEngine, prefetchSpeech } = await import("./cloudSpeechEngine");

const wav = (samples, rate = 1000) => {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const put = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  put(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); put(8, "WAVE");
  put(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  put(36, "data"); v.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, s, true));
  return buf;
};

test("silence around each chunk is trimmed so verses flow without a pause", () => {
  // 0.5s silence, 0.2s voice, 0.5s silence at 1000 Hz
  const samples = [...Array(500).fill(0), ...Array(200).fill(8000), ...Array(500).fill(0)];
  const { duration } = trimWav(wav(samples));
  // keeps 0.02s before and 0.07s after the voice
  expect(duration).toBeCloseTo(0.29, 2);
});

test("a credit failure stops prefetch and repeated requests without an unhandled rejection", async () => {
  const oldFetch = globalThis.fetch;
  const oldCaches = globalThis.caches;
  let requests = 0;
  globalThis.caches = { open: async () => ({ match: async () => undefined }) };
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ details: JSON.stringify({ message: "Not enough credits" }) }), { status: 402 });
  };
  try {
    prefetchSpeech(Array(150).fill("scripture"), "male");
    await new Promise((r) => setTimeout(r, 30));
    expect(requests).toBe(1);
    prefetchSpeech(Array(150).fill("another"), "male");
    await new Promise((r) => setTimeout(r, 30));
    expect(requests).toBe(1);
  } finally { globalThis.fetch = oldFetch; globalThis.caches = oldCaches; }
});

test("non-WAV audio is passed through untouched", () => {
  const { duration, blob } = trimWav(new ArrayBuffer(10));
  expect(duration).toBeNull();
  expect(blob.size).toBe(10);
});

test("cloud glow waits for playback, freezes while paused and follows media seeks at faster speeds", async () => {
  const oldAudio = globalThis.Audio;
  const oldCaches = globalThis.caches;
  const instances = [];
  class FakeAudio {
    paused = true;
    seeking = false;
    readyState = 4;
    currentTime = 0;
    duration = 2;
    src = "";
    setAttribute() {}
    load() {}
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    constructor() { instances.push(this); }
  }
  globalThis.Audio = FakeAudio;
  globalThis.caches = { open: async () => ({ match: async () => new Response(wav(Array(2000).fill(8000))) }) };
  const seen = [];
  try {
    cloudSpeechEngine.speak(["one", "two", "six", "ten"], 0, { voiceId: "female", rate: 1.75 }, {
      onWord: (i) => seen.push(i), onEnd: () => {}, onError: (e) => { throw new Error(e); },
    });
    expect(seen).toEqual([]);
    await new Promise((r) => setTimeout(r, 50));
    const audio = instances[0];
    expect(audio.playbackRate).toBe(1.75);
    expect(seen).toEqual([0]);
    audio.currentTime = 1.1;
    audio.ontimeupdate();
    expect(seen.at(-1)).toBe(2);
    audio.paused = true;
    audio.currentTime = 1.6;
    audio.ontimeupdate();
    expect(seen.at(-1)).toBe(2);
    audio.paused = false;
    audio.currentTime = 0.6;
    audio.onseeked();
    expect(seen.at(-1)).toBe(1);
  } finally {
    cloudSpeechEngine.stop();
    globalThis.Audio = oldAudio;
    globalThis.caches = oldCaches;
  }
});
