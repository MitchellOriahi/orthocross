import { Pause, Play, Square, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import type { useScriptureSpeech } from "@/hooks/useScriptureSpeech";

type Speech = ReturnType<typeof useScriptureSpeech>;

export const SpeechControls = ({ speech, disabled }: { speech: Speech; disabled?: boolean }) => {
  const playing = speech.status === "playing";
  const noVoices = !speech.supported || (speech.voicesLoaded && speech.voices.length === 0);
  const english = speech.voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const others = speech.voices.filter((v) => !v.lang.toLowerCase().startsWith("en"));

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={playing ? "default" : "outline"}
        size="sm"
        disabled={disabled}
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Voice settings">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-4" align="end">
          <p className="text-sm font-semibold">Read aloud</p>
          {noVoices ? (
            <p className="text-sm text-muted-foreground">No speech voices are available on this device.</p>
          ) : (
            <>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Voice</span>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={speech.voiceId ?? ""}
                  onChange={(e) => speech.setVoiceId(e.target.value)}
                >
                  {english.length > 0 && (
                    <optgroup label="English">
                      {english.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label="Other languages">
                      {others.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.lang})</option>)}
                    </optgroup>
                  )}
                </select>
              </label>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Speed</span>
                  <span>{speech.rate.toFixed(2).replace(/0$/, "")}×</span>
                </div>
                <Slider value={[speech.rate]} min={0.5} max={1.75} step={0.25} onValueChange={(v) => speech.setRate(v[0])} />
              </div>
              <p className="text-xs text-muted-foreground">Tap any word while listening to jump there.</p>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
