import { useState } from "react";
import { Cross } from "lucide-react";
import type { SaintDisplayIcon } from "@/data/saintDisplayIcons";
import type { CategoryStyleArtwork } from "@/data/categoryStyleArtwork";

export function CategoryArtwork({ artwork, label }: { artwork: CategoryStyleArtwork; label: string }) {
  const [failed, setFailed] = useState(false);
  const silhouette = artwork.image_shape === "silhouette";
  // A silhouette panel keeps its own outline, so the tile follows the artwork's
  // own proportions (image_box_aspect) instead of one fixed frame for all of them.
  // An arched panel also carries transparent space above its own peak, so it can
  // be lifted by a share of the tile width (image_shift_up); a percentage margin
  // scales with the tile instead of being a fixed pixel count.
  const boxStyle = silhouette ? {
    aspectRatio: artwork.image_box_aspect ?? "3 / 4",
    marginTop: artwork.image_shift_up ? `-${artwork.image_shift_up}%` : undefined,
  } : undefined;
  return <span className={silhouette ? "relative block w-full shrink-0" : "relative block aspect-square w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted"} style={boxStyle}>
    {failed ? <span className="flex h-full items-center justify-center text-muted-foreground"><Cross className="h-7 w-7" aria-hidden="true" /></span>
      : <img src={artwork.image_url} alt={label} decoding="async" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-contain object-center" />}
  </span>;
}

export function CategoryArtworkCredit({ artwork, label }: { artwork: SaintDisplayIcon; label: string }) {
  return <p>
    {artwork.image_source.startsWith("http") ? <a href={artwork.image_source} target="_blank" rel="noopener noreferrer" className="underline">{label}</a> : label}{" · "}
    {artwork.image_license_url ? <a href={artwork.image_license_url} target="_blank" rel="noopener noreferrer" className="underline">{artwork.image_license}</a> : artwork.image_license}
    <span className="block">{artwork.image_author}</span>
    <span className="block">{artwork.image_modification}</span>
  </p>;
}