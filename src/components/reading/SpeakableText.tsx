import { memo } from "react";
import { spokenForm } from "@/lib/speech/audioTiming";

export interface Token {
  t: string;
  i: number | null; // global word index, null for whitespace
}

/** Split text into word tokens while preserving whitespace exactly. */
export function tokenize(text: string, start: number): { tokens: Token[]; words: string[] } {
  const tokens: Token[] = [];
  const words: string[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part) || !spokenForm(part)) tokens.push({ t: part, i: null });
    else {
      tokens.push({ t: part, i: start + words.length });
      words.push(part);
    }
  }
  return { tokens, words };
}

interface Props {
  tokens: Token[];
  /** Highest spoken global index within this verse, or -1 for none. */
  spokenUpTo: number;
  currentIndex: number;
  interactive: boolean;
  onWordTap: (i: number) => void;
}

export const SpeakableText = memo(function SpeakableText({ tokens, spokenUpTo, currentIndex, interactive, onWordTap }: Props) {
  return (
    <>
      {tokens.map((tok, k) =>
        tok.i === null ? (
          tok.t
        ) : (
          <span
            key={k}
            data-word={tok.i}
            className={`tts-word${tok.i <= spokenUpTo ? " tts-spoken" : ""}${tok.i === currentIndex ? " tts-current" : ""}`}
            onClick={
              interactive
                ? (e) => {
                    e.stopPropagation();
                    onWordTap(tok.i!);
                  }
                : undefined
            }
          >
            {tok.t}
          </span>
        ),
      )}
    </>
  );
});
