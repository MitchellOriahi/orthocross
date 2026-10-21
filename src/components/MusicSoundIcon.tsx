import { MegaphoneOff } from "lucide-react";

/**
 * Music state glyph.
 *
 * Playing: the standard megaphone with sound lines coming out of its mouth.
 * Muted: the megaphone with a line through it.
 *
 * The megaphone body and its handle are Lucide's own paths, scaled and nudged so
 * the mouth sits where Lucide's speaker cone ends. That lets the two sound lines
 * be Lucide's Volume2 arcs unchanged, so both parts share one stroke weight and
 * one visual language.
 */
const MEGAPHONE_SCALE = 0.68;
const MEGAPHONE_SHIFT_X = -0.78;
const MEGAPHONE_SHIFT_Y = 3.84;

export function MusicSoundIcon({
  playing,
  className,
}: {
  playing: boolean;
  className?: string;
}) {
  if (!playing) {
    return <MegaphoneOff className={className} />;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g
        transform={`translate(${MEGAPHONE_SHIFT_X} ${MEGAPHONE_SHIFT_Y}) scale(${MEGAPHONE_SCALE})`}
        strokeWidth={2 / MEGAPHONE_SCALE}
      >
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </g>
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </svg>
  );
}

export default MusicSoundIcon;
