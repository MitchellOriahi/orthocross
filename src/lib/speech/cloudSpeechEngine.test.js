import { test, expect, mock } from "bun:test";
mock.module("@/integrations/supabase/client", () => ({ supabase: {} }));
const { trimWav } = await import("./cloudSpeechEngine");

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

test("non-WAV audio is passed through untouched", () => {
  const { duration, blob } = trimWav(new ArrayBuffer(10));
  expect(duration).toBeNull();
  expect(blob.size).toBe(10);
});
