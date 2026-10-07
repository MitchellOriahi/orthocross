import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { saintPageRoster } from "@/data/saintPageRoster";
import type { SaintCardIcon } from "@/data/saintCardIcons";
import { SaintIconCircle } from "@/components/resources/SaintCardIcon";
import { resolveSaintCardIcon, useSaintIconOverrides } from "@/hooks/useSaintIconOverrides";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const clamp = (v: number) => Math.min(100, Math.max(0, v));

export default function IconTuner() {
  const { data: overrides } = useSaintIconOverrides();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(saintPageRoster[0]?.id ?? "");
  const [draft, setDraft] = useState<SaintCardIcon | null>(null);
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);

  const saints = useMemo(() => {
    const n = query.trim().toLowerCase();
    return saintPageRoster.filter(s => !n || `${s.prefix} ${s.name}`.toLowerCase().includes(n));
  }, [query]);
  const selected = saintPageRoster.find(s => s.id === selectedId);
  const current = draft ?? (selected ? resolveSaintCardIcon(selected.id, selected.iconUrl, overrides) : null);
  const blank: SaintCardIcon = { image_url: "", image_source: "", image_license: "", image_attribution: "", focus_x: 50, focus_y: 30, zoom: 1 };
  const edit = (patch: Partial<SaintCardIcon>) => setDraft({ ...(current ?? blank), ...patch });

  const select = (id: string) => { setSelectedId(id); setDraft(null); };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, fx: current.focus_x, fy: current.focus_y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !current) return;
    const size = e.currentTarget.getBoundingClientRect().width;
    const k = 100 / (size * current.zoom);
    edit({ focus_x: clamp(drag.current.fx - (e.clientX - drag.current.x) * k), focus_y: clamp(drag.current.fy - (e.clientY - drag.current.y) * k) });
  };

  const upload = async (file: File) => {
    if (!selected) return;
    const path = `${selected.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("saint-icons").upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data, error: urlError } = await supabase.storage.from("saint-icons").createSignedUrl(path, TEN_YEARS);
    if (urlError || !data) return toast.error(urlError?.message ?? "Could not create image link");
    edit({ image_url: data.signedUrl, image_source: "Uploaded in icon tuner", image_license: "", image_attribution: "", focus_x: 50, focus_y: 30, zoom: 1 });
  };

  const save = async () => {
    if (!selected || !current) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("saint_icon_overrides").upsert({ saint_id: selected.id, ...current, updated_by: auth.user?.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Icon saved");
    setDraft(null);
    queryClient.invalidateQueries({ queryKey: ["saint-icon-overrides"] });
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-6 p-4 md:grid-cols-[18rem_1fr]">
      <aside className="flex max-h-screen flex-col gap-3 md:sticky md:top-0 md:py-4">
        <h1 className="text-xl font-semibold">Icon tuner</h1>
        <Input placeholder="Search saints" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {saints.map(s => (
            <button key={s.id} onClick={() => select(s.id)} className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-accent ${s.id === selectedId ? "bg-accent" : ""}`}>
              <SaintIconCircle key={s.id + (overrides?.get(s.id)?.image_url ?? "")} icon={resolveSaintCardIcon(s.id, s.iconUrl, overrides)} className="!h-10 !w-10" />
              <span className="min-w-0 truncate">{[s.prefix, s.name].filter(Boolean).join(" ")}</span>
            </button>
          ))}
        </div>
      </aside>
      {selected && (
        <main className="space-y-5 py-4">
          <h2 className="text-lg font-semibold">{[selected.prefix, selected.name].filter(Boolean).join(" ")}</h2>
          <div className="flex flex-wrap items-end gap-6">
            <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => (drag.current = null)} className="cursor-grab touch-none select-none active:cursor-grabbing">
              <SaintIconCircle key={current?.image_url ?? "none"} icon={current} className="!h-60 !w-60" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">List size</p>
              <SaintIconCircle key={"s" + (current?.image_url ?? "none")} icon={current} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Drag the large circle to move the focus point onto the face.</p>
          <div className="max-w-md space-y-2">
            <p className="text-sm">Zoom: {(current?.zoom ?? 1).toFixed(2)}</p>
            <Slider min={1} max={8} step={0.05} value={[current?.zoom ?? 1]} onValueChange={([z]) => edit({ zoom: z })} disabled={!current} />
            <p className="text-xs text-muted-foreground">Focus: {Math.round(current?.focus_x ?? 50)}% / {Math.round(current?.focus_y ?? 30)}%</p>
          </div>
          <div className="grid max-w-xl gap-2">
            <Input placeholder="Image URL" value={current?.image_url ?? ""} onChange={e => edit({ image_url: e.target.value })} />
            <Input placeholder="Source page URL" value={current?.image_source ?? ""} onChange={e => edit({ image_source: e.target.value })} />
            <Input placeholder="License" value={current?.image_license ?? ""} onChange={e => edit({ image_license: e.target.value })} />
            <Input placeholder="Attribution" value={current?.image_attribution ?? ""} onChange={e => edit({ image_attribution: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline"><label className="cursor-pointer">Replace image<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} /></label></Button>
            <Button onClick={save} disabled={!current?.image_url || saving}>{saving ? "Saving..." : "Save"}</Button>
            {draft && <Button variant="ghost" onClick={() => setDraft(null)}>Discard changes</Button>}
          </div>
        </main>
      )}
    </div>
  );
}
