import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIBLE_AUDIO_BUCKET, chapterAudioPath, type BibleAudioVoice } from "@/config/bibleAudio";
import { buildTimings, wordAt, type TimedWord, type TimingFile } from "@/lib/speech/audioTiming";

export type SpeechStatus = "idle" | "playing" | "paused" | "finished" | "fading";
export type AudioAvailability = "checking" | "available" | "missing" | "error";

const VOICE_KEY = "bibleAudioVoice";
const RATE_KEY = "ttsRate";

export interface ChapterAudioRef {
  translation: string;
  book: string;
  chapter: number;
  nextChapter?: number | null;
  title?: string;
}

async function signedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BIBLE_AUDIO_BUCKET).createSignedUrl(path, 60 * 60 * 6);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function useScriptureSpeech(words: string[], ref: ChapterAudioRef) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [current, setCurrent] = useState(-1);
  const [voice, setVoiceState] = useState<BibleAudioVoice>(() => (localStorage.getItem(VOICE_KEY) === "male" ? "male" : "female"));
  const [rate, setRateState] = useState(() => {
    const r = Number(localStorage.getItem(RATE_KEY));
    return [0.75, 1, 1.25, 1.5].includes(r) ? r : 1;
  });
  const [availability, setAvailability] = useState<AudioAvailability>("checking");
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timingFileRef = useRef<TimingFile | null>(null);
  const timingsRef = useRef<TimedWord[]>([]);
  const rafRef = useRef<number | null>(null);
  const fadeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const statusRef = useRef(status);
  statusRef.current = status;
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const key = `${ref.translation}|${ref.book}|${ref.chapter}|${voice}`;

  const clearFades = () => { fadeTimers.current.forEach(clearTimeout); fadeTimers.current = []; };
  const stopLoop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  const recomputeTimings = useCallback(() => {
    const file = timingFileRef.current;
    const a = audioRef.current;
    if (!file) return;
    const duration = a && isFinite(a.duration) ? a.duration : file.duration ?? 0;
    const { timings, matched } = buildTimings(wordsRef.current, file, duration);
    if (!matched && wordsRef.current.length) {
      console.warn(`[bible-audio] Word count mismatch for ${key}: text has ${wordsRef.current.length} words, timing file has ${file.words?.length ?? 0}. Using proportional timing.`);
    }
    timingsRef.current = timings;
  }, [key]);

  const loop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const i = wordAt(timingsRef.current, a.currentTime);
    setCurrent((prev) => (prev === i ? prev : i));
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Load (or reload) the chapter's audio for the chosen voice.
  useEffect(() => {
    let cancelled = false;
    clearFades();
    stopLoop();
    audioRef.current?.pause();
    audioRef.current = null;
    timingFileRef.current = null;
    timingsRef.current = [];
    setStatus("idle");
    setCurrent(-1);
    setError(null);
    setAvailability("checking");
    if (!ref.book || !ref.chapter) return;

    (async () => {
      try {
        const [mp3, json] = await Promise.all([
          signedUrl(chapterAudioPath(ref.translation, voice, ref.book, ref.chapter, "mp3")),
          signedUrl(chapterAudioPath(ref.translation, voice, ref.book, ref.chapter, "json")),
        ]);
        if (cancelled) return;
        if (!mp3 || !json) return setAvailability("missing");
        const res = await fetch(json);
        if (cancelled) return;
        if (res.status === 404 || res.status === 400) return setAvailability("missing");
        if (!res.ok) throw new Error(String(res.status));
        timingFileRef.current = (await res.json()) as TimingFile;
        const a = new Audio();
        a.preload = "metadata";
        (a as any).preservesPitch = true;
        (a as any).webkitPreservesPitch = true;
        a.src = mp3;
        a.playbackRate = rate;
        a.addEventListener("loadedmetadata", recomputeTimings);
        a.addEventListener("ended", () => {
          stopLoop();
          setCurrent(wordsRef.current.length - 1);
          setStatus("finished");
          fadeTimers.current.push(
            setTimeout(() => setStatus("fading"), 1500),
            setTimeout(() => { setStatus("idle"); setCurrent(-1); }, 2300),
          );
        });
        a.addEventListener("error", () => {
          if (cancelled) return;
          stopLoop();
          setError("The audio couldn't be loaded.");
          setAvailability("error");
          if (statusRef.current === "playing") setStatus("paused");
        });
        audioRef.current = a;
        recomputeTimings();
        setAvailability("available");

        // Preload the next chapter only on Wi-Fi when the browser reports it.
        const conn = (navigator as any).connection;
        if (ref.nextChapter && conn?.type === "wifi") {
          const next = await signedUrl(chapterAudioPath(ref.translation, voice, ref.book, ref.nextChapter, "mp3"));
          if (next && !cancelled) { const p = new Audio(); p.preload = "auto"; p.src = next; }
        }
      } catch {
        if (!cancelled) { setError("The audio couldn't be loaded."); setAvailability("error"); }
      }
    })();

    return () => { cancelled = true; stopLoop(); audioRef.current?.pause(); clearFades(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  // Text loaded after the audio: rebuild the word timings.
  useEffect(() => { recomputeTimings(); }, [words, recomputeTimings]);

  const playFrom = useCallback(async (time?: number) => {
    const a = audioRef.current;
    if (!a) return;
    clearFades();
    if (time !== undefined) a.currentTime = time;
    setAutoScroll(true);
    try {
      await a.play();
      setStatus("playing");
      stopLoop();
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setError("The audio couldn't be played.");
    }
  }, [loop]);

  const play = useCallback(() => {
    const s = statusRef.current;
    playFrom(s === "paused" ? undefined : 0);
  }, [playFrom]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    audioRef.current?.pause();
    stopLoop();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    clearFades();
    stopLoop();
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
    setStatus("idle");
    setCurrent(-1);
  }, []);

  const seek = useCallback((i: number) => {
    const t = timingsRef.current[i];
    if (!t) return;
    setCurrent(i);
    playFrom(t.s);
  }, [playFrom]);

  const setRate = (r: number) => {
    setRateState(r);
    localStorage.setItem(RATE_KEY, String(r));
    if (audioRef.current) audioRef.current.playbackRate = r;
  };
  const setVoice = (v: BibleAudioVoice) => {
    setVoiceState(v);
    localStorage.setItem(VOICE_KEY, v);
  };
  const retry = () => setReloadToken((n) => n + 1);

  // Lock-screen controls.
  useEffect(() => {
    const ms = (navigator as any).mediaSession;
    if (!ms || availability !== "available") return;
    try {
      ms.metadata = new (window as any).MediaMetadata({ title: ref.title ?? `${ref.book} ${ref.chapter}`, artist: "OrthoCross", album: ref.translation.toUpperCase() });
      ms.setActionHandler("play", () => play());
      ms.setActionHandler("pause", () => pause());
      ms.setActionHandler("stop", () => stop());
      ms.setActionHandler("seekto", (d: any) => { if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime; });
    } catch { /* unsupported action */ }
  }, [availability, play, pause, stop, ref.title, ref.book, ref.chapter, ref.translation]);

  useEffect(() => {
    const ms = (navigator as any).mediaSession;
    if (ms) ms.playbackState = status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
  }, [status]);

  // Backgrounding pauses and keeps the position.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") pause(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", pause);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", pause);
    };
  }, [pause]);

  // Manual scrolling turns off auto-scroll until play or a word tap.
  useEffect(() => {
    if (status !== "playing") return;
    const off = () => setAutoScroll(false);
    window.addEventListener("wheel", off, { passive: true });
    window.addEventListener("touchmove", off, { passive: true });
    return () => { window.removeEventListener("wheel", off); window.removeEventListener("touchmove", off); };
  }, [status]);

  return {
    status, current, voice, rate, error, autoScroll, availability,
    active: status !== "idle",
    play, pause, stop, seek, setRate, setVoice, retry,
  };
}
