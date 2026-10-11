/** Audio-clock word estimates. Gemini WAV has no phoneme/word timestamps. */
export interface AudioWindow { start: number; end: number; active: boolean }

export function buildWordTimeline(words: string[], duration: number, windows: AudioWindow[] = []): number[] {
  if (!words.length || duration <= 0) return [];
  // A fixed onset cost avoids treating short words as nearly instantaneous.
  const weights = words.map((word) => 140 + 62 * word.replace(/[^\p{L}\p{N}]/gu, "").length);
  const total = weights.reduce((a, b) => a + b, 0);
  const active = windows.filter((w) => w.active && w.end > w.start);
  const speechDuration = active.reduce((sum, w) => sum + w.end - w.start, 0);
  let weight = 0;
  return weights.map((value) => {
    const target = weight / total;
    weight += value;
    if (!speechDuration) return target * duration;
    let remaining = target * speechDuration;
    for (const w of active) {
      const length = w.end - w.start;
      if (remaining < length) return w.start + remaining;
      remaining -= length;
    }
    return active[active.length - 1]?.end ?? duration;
  });
}

/** Read only the media clock: stalled/paused playback must never advance glow. */
export function wordAtTime(starts: number[], currentTime: number): number {
  if (!starts.length || currentTime < starts[0]) return -1;
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    if (starts[mid] <= currentTime) low = mid;
    else high = mid;
  }
  return low;
}