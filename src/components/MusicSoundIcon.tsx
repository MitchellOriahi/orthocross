import { useId } from "react";

/**
 * Music state glyph, drawn to match the supplied "max volume" megaphone:
 * a solid horn (rounded base, flared cone, flat vertical mouth, sharp tips)
 * with three thick concentric sound bands cutting it square.
 *
 * Playing: horn + three sound bands.
 * Muted:   the same horn and bands with a line through them. The line is cut
 *          out of the shapes with a mask rather than painted over them, so the
 *          gap stays clean on any card colour or theme.
 *
 * The reference is wider than it is tall, so the drawing keeps its own
 * proportions inside the square box instead of being stretched to fill it.
 */
const HORN =
  "M2.5 11 A2 2 0 0 1 4.5 9 H6 L11 4.5 V19.5 L6 15 H4.5 A2 2 0 0 1 2.5 13 V11 Z";

// Sound bands: concentric about the mouth centre (11, 12), shortest innermost.
const SOUND_BANDS = [
  "M14.04 8.96 A4.3 4.3 0 0 1 14.04 15.04",
  "M15.59 6.72 A7 7 0 0 1 15.59 17.28",
  "M16.97 4.36 A9.7 9.7 0 0 1 16.97 19.64",
];

const SLASH = "M4 4 L20 20";
const BAND_WEIGHT = 1.9;
const CUT_WEIGHT = 3.6;

function Megaphone({ color }: { color: string }) {
  return (
    <g fill={color} stroke={color} strokeWidth={BAND_WEIGHT}>
      <path d={HORN} stroke="none" />
      {SOUND_BANDS.map((band) => (
        <path key={band} d={band} fill="none" />
      ))}
    </g>
  );
}

export function MusicSoundIcon({
  playing,
  className,
}: {
  playing: boolean;
  className?: string;
}) {
  const cutId = `megaphone-cut-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {playing ? (
        <Megaphone color="currentColor" />
      ) : (
        <>
          <mask id={cutId}>
            <rect width="24" height="24" fill="black" />
            <Megaphone color="white" />
            <path d={SLASH} stroke="black" strokeWidth={CUT_WEIGHT} fill="none" />
          </mask>
          <g mask={`url(#${cutId})`}>
            <Megaphone color="currentColor" />
          </g>
          <path d={SLASH} stroke="currentColor" strokeWidth={BAND_WEIGHT} fill="none" />
        </>
      )}
    </svg>
  );
}

export default MusicSoundIcon;
