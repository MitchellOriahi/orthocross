import { useCallback, useEffect, useRef, useState } from "react";
import { prefetchSpeech, speechEngine, type VoiceOption } from "@/lib/speech/speechEngine";

export type SpeechStatus = "idle" | "playing" | "paused" | "finished" | "fading";

const VOICE_KEY = "ttsVoiceId";
const RATE_KEY = "ttsRate";
const AUTO_KEY = "ttsAutoContinue";

export function useScriptureSpeech(words: string[], resetKey: string, onChapterEnd?: () => void) {
  const [autoContinue, setAutoContinueState] = useState(() => localStorage.getItem(AUTO_KEY) === "1");
  const autoRef = useRef(autoContinue);
  autoRef.current = autoContinue;
  const onEndRef = useRef(onChapterEnd);
  onEndRef.current = onChapterEnd;
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [current, setCurrent] = useState(-1);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [voiceId, setVoiceIdState] = useState<string | null>(() => localStorage.getItem(VOICE_KEY));
  const [rate, setRateState] = useState(() => Number(localStorage.getItem(RATE_KEY)) || 1);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const statusRef = useRef(status);
  statusRef.current = status;
  const currentRef = useRef(current);
  currentRef.current = current;
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const fadeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const supported = speechEngine.isSupported();

  useEffect(() => {
    if (!supported) {
      setVoicesLoaded(true);
      return;
    }
    speechEngine.getVoices().then((v) => {
      setVoices(v);
      setVoicesLoaded(true);
      setVoiceIdState((prev) => (prev && v.some((x) => x.id === prev) ? prev : speechEngine.pickDefaultVoice(v)));
    });
  }, [supported]);

  // Prepare the chapter's first audio in the background as soon as it opens,
  // so pressing Play starts almost instantly.
  useEffect(() => {
    if (!supported || !voiceId || words.length === 0) return;
    prefetchSpeech(words, voiceId);
  }, [supported, voiceId, words]);

  const clearFades = () => {
    fadeTimers.current.forEach(clearTimeout);
    fadeTimers.current = [];
  };

  const start = useCallback(
    (from: number, opts?: { rate?: number; voiceId?: string | null }) => {
      clearFades();
      if (!supported || (voicesLoaded && voices.length === 0)) {
        setError("No speech voices are available on this device.");
        return;
      }
      setError(null);
      setAutoScroll(true);
      setStatus("playing");
      setCurrent(from);
      speechEngine.speak(
        wordsRef.current,
        from,
        { rate: opts?.rate ?? rate, voiceId: opts?.voiceId !== undefined ? opts.voiceId : voiceId },
        {
          onWord: (i) => setCurrent(i),
          onEnd: () => {
            if (autoRef.current && onEndRef.current) {
              setStatus("idle");
              setCurrent(-1);
              onEndRef.current();
              return;
            }
            setCurrent(wordsRef.current.length - 1);
            setStatus("finished");
            fadeTimers.current.push(
              setTimeout(() => setStatus("fading"), 1500),
              setTimeout(() => {
                setStatus("idle");
                setCurrent(-1);
              }, 2300),
            );
          },
          onError: (msg) => {
            setError(msg);
            setStatus("paused");
          },
        },
      );
    },
    [supported, voicesLoaded, voices.length, rate, voiceId],
  );

  const play = useCallback(() => {
    const s = statusRef.current;
    const from = s === "paused" && currentRef.current >= 0 ? currentRef.current : 0;
    start(from);
  }, [start]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    speechEngine.stop();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    clearFades();
    speechEngine.stop();
    setStatus("idle");
    setCurrent(-1);
  }, []);

  /** Tapping a word while playing or paused jumps there and continues. */
  const seek = useCallback((i: number) => start(i), [start]);

  const setRate = (r: number) => {
    setRateState(r);
    localStorage.setItem(RATE_KEY, String(r));
    if (statusRef.current === "playing") start(Math.max(0, currentRef.current), { rate: r });
  };
  const setVoiceId = (id: string) => {
    setVoiceIdState(id);
    localStorage.setItem(VOICE_KEY, id);
    if (statusRef.current === "playing") start(Math.max(0, currentRef.current), { voiceId: id });
  };

  // Chapter / translation change clears everything.
  useEffect(() => {
    stop();
  }, [resetKey, stop]);

  // Backgrounding, locking, leaving: pause and keep position.
  useEffect(() => {
    const onHide = () => {
      // Continuous listening keeps playing with the screen off.
      if (document.visibilityState === "hidden" && !autoRef.current) pause();
    };
    document.addEventListener("visibilitychange", onHide);
    const onPageHide = () => { if (!autoRef.current) pause(); };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      speechEngine.stop();
      clearFades();
    };
  }, [pause]);

  // Manual scrolling turns off auto-scroll until play or a word tap.
  useEffect(() => {
    if (status !== "playing") return;
    const off = () => setAutoScroll(false);
    window.addEventListener("wheel", off, { passive: true });
    window.addEventListener("touchmove", off, { passive: true });
    return () => {
      window.removeEventListener("wheel", off);
      window.removeEventListener("touchmove", off);
    };
  }, [status]);

  const setAutoContinue = (v: boolean) => {
    setAutoContinueState(v);
    localStorage.setItem(AUTO_KEY, v ? "1" : "0");
  };

  // Lock-screen controls so audio can keep going and be paused with the screen off.
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms) return;
    try {
      ms.playbackState = status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
      ms.setActionHandler("play", () => play());
      ms.setActionHandler("pause", () => pause());
      ms.setActionHandler("stop", () => stop());
    } catch { /* unsupported */ }
  }, [status, play, pause, stop]);

  return {
    autoContinue, setAutoContinue,
    status, current, voices, voiceId, rate, error, autoScroll, supported, voicesLoaded,
    active: status !== "idle",
    play, pause, stop, seek, setRate, setVoiceId, clearError: () => setError(null),
  };
}
