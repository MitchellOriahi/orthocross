import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SAINT_CARD_ICONS, type SaintCardIcon } from "@/data/saintCardIcons";

export type SaintIconOverride = Partial<SaintCardIcon> & { saint_id: string };

export function useSaintIconOverrides() {
  return useQuery({
    queryKey: ["saint-icon-overrides"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("saint_icon_overrides").select("*");
      if (error) throw error;
      return new Map((data ?? []).map(row => [row.saint_id, row as unknown as SaintIconOverride]));
    },
  });
}

// Saved tuner values win over the bundled registry; saints with an older saved
// icon but no registry entry fall back to it with a default crop.
export function resolveSaintCardIcon(saintId: string, fallbackUrl: string | undefined, overrides?: Map<string, SaintIconOverride>): SaintCardIcon | null {
  const base = SAINT_CARD_ICONS[saintId] ?? (fallbackUrl ? { image_url: fallbackUrl, image_source: "", image_license: "", image_attribution: "", focus_x: 50, focus_y: 30, zoom: 1 } : null);
  const o = overrides?.get(saintId);
  if (!o) return base;
  const image_url = o.image_url || base?.image_url;
  if (!image_url) return null;
  return {
    image_url,
    image_source: o.image_source ?? base?.image_source ?? "",
    image_license: o.image_license ?? base?.image_license ?? "",
    image_attribution: o.image_attribution ?? base?.image_attribution ?? "",
    focus_x: Number(o.focus_x ?? base?.focus_x ?? 50),
    focus_y: Number(o.focus_y ?? base?.focus_y ?? 30),
    zoom: Number(o.zoom ?? base?.zoom ?? 1),
  };
}
