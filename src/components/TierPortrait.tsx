import { useTheme } from "next-themes";
import { TIER_ICONS, TIER_ICONS_LIGHT, GIFT_CROSS_ICON, GIFT_CROSS_ICON_LIGHT } from "@/config/donorTiers";

interface TierPortraitProps {
  /** Tier key, or null for the pre-donation Orthodox cross. */
  tierKey: string | null;
  alt?: string;
  className?: string;
}

/**
 * Tier portrait that follows the theme: gold line art on near-black in dark
 * mode, bronze line art on parchment in light mode.
 */
export const TierPortrait = ({ tierKey, alt = "", className }: TierPortraitProps) => {
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme !== "dark";
  const src = tierKey
    ? (light ? TIER_ICONS_LIGHT[tierKey] ?? TIER_ICONS[tierKey] : TIER_ICONS[tierKey])
    : (light ? GIFT_CROSS_ICON_LIGHT : GIFT_CROSS_ICON);
  return <img src={src} alt={alt} className={className} loading="lazy" />;
};
