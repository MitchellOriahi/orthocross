import { useCallback, useEffect, useRef, useState } from "react";
import { speechEngine, type VoiceOption } from "@/lib/speech/speechEngine";

export type SpeechStatus = "idle" | "playing" | "paused" | "finished" | "fading";

const VOICE_KEY = "ttsVoiceId";
const RATE_KEY = "ttsRate";

export function useScriptureSpeech(words: string[], resetKey: string) {
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
      if (document.visibilityState === "hidden") pause();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", pause);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", pause);
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

  return {
    status, current, voices, voiceId, rate, error, autoScroll, supported, voicesLoaded,
    active: status !== "idle",
    play, pause, stop, seek, setRate, setVoiceId, clearError: () => setError(null),
  };
}
