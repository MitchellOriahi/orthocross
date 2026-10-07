import { Pause, Play, Square, SlidersHorizontal, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BIBLE_AUDIO_SPEEDS } from "@/config/bibleAudio";
import type { useScriptureSpeech } from "@/hooks/useScriptureSpeech";

type Speech = ReturnType<typeof useScriptureSpeech>;

export const SpeechControls = ({ speech, disabled }: { speech: Speech; disabled?: boolean }) => {
  const playing = speech.status === "playing";
  const settings = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Voice settings">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-4" align="end">
        <p className="text-sm font-semibold">Read aloud</p>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Voice</span>
          <div className="grid grid-cols-2 gap-1">
            {(["male", "female"] as const).map((v) => (
              <Button key={v} size="sm" variant={speech.voice === v ? "default" : "outline"} aria-pressed={speech.voice === v} onClick={() => speech.setVoice(v)}>
                {v === "male" ? "Male" : "Female"}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Speed</span>
          <div className="grid grid-cols-4 gap-1">
            {BIBLE_AUDIO_SPEEDS.map((r) => (
              <Button key={r} size="sm" variant={speech.rate === r ? "default" : "outline"} aria-pressed={speech.rate === r} onClick={() => speech.setRate(r)} className="px-0 text-xs">
                {r}×
              </Button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Tap any word while listening to jump there.</p>
      </PopoverContent>
    </Popover>
  );

  if (speech.availability === "missing") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground max-w-[9rem] leading-tight">Audio isn't available for this chapter yet.</span>
        {settings}
      </div>
    );
  }

  if (speech.availability === "error") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{speech.error ?? "Audio failed to load."}</span>
        <Button variant="outline" size="sm" onClick={speech.retry} aria-label="Retry loading audio">
          <RotateCw className="w-4 h-4 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={playing ? "default" : "outline"}
        size="sm"
        disabled={disabled || speech.availability !== "available"}
        aria-label={playing ? "Pause reading aloud" : "Read chapter aloud"}
        onClick={playing ? speech.pause : speech.play}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      {(speech.status === "playing" || speech.status === "paused") && (
        <Button variant="outline" size="sm" aria-label="Stop reading aloud" onClick={speech.stop}>
          <Square className="w-4 h-4" />
        </Button>
      )}
      {settings}
    </div>
  );
};
