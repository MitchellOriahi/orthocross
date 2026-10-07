import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIBLE_BOOKS } from "@/data/bibleContent";
import { BIBLE_TRANSLATIONS } from "@/data/bibleTranslations";
import { BIBLE_AUDIO_BUCKET, BIBLE_AUDIO_VOICES, bookSlug, type BibleAudioVoice } from "@/config/bibleAudio";

type Files = Record<BibleAudioVoice, Set<string>>;
const VOICES = Object.keys(BIBLE_AUDIO_VOICES) as BibleAudioVoice[];

export default function AudioAdmin() {
  const [translation, setTranslation] = useState("kjv");
  const [book, setBook] = useState("John");
  const [files, setFiles] = useState<Files | null>(null);

  useEffect(() => {
    setFiles(null);
    let cancelled = false;
    Promise.all(
      VOICES.map(async (v) => {
        const { data } = await supabase.storage
          .from(BIBLE_AUDIO_BUCKET)
          .list(`${translation}/${BIBLE_AUDIO_VOICES[v]}/${bookSlug(book)}`, { limit: 1000 });
        return [v, new Set((data ?? []).map((f) => f.name))] as const;
      }),
    ).then((r) => !cancelled && setFiles(Object.fromEntries(r) as Files));
    return () => { cancelled = true; };
  }, [translation, book]);

  const total = BIBLE_BOOKS.find((b) => b.title === book)?.totalChapters ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-nav">
      <h1 className="text-xl font-semibold mb-1">Bible audio</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Path: {translation}/&#123;voice&#125;/{bookSlug(book)}/&#123;chapter&#125;.mp3 + .json
      </p>
      <div className="flex gap-2 mb-4">
        <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={translation} onChange={(e) => setTranslation(e.target.value)}>
          {BIBLE_TRANSLATIONS.map((t) => <option key={t.id} value={t.id}>{t.abbreviation}</option>)}
        </select>
        <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={book} onChange={(e) => setBook(e.target.value)}>
          {BIBLE_BOOKS.map((b) => <option key={b.title} value={b.title}>{b.title}</option>)}
        </select>
      </div>
      {!files ? (
        <p className="text-sm text-muted-foreground">Checking files…</p>
      ) : (
        <table className="w-full text-sm border border-border">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2">Chapter</th>
              {VOICES.map((v) => <th key={v} className="text-left p-2 capitalize">{v}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: total }, (_, k) => k + 1).map((ch) => {
              const cells = VOICES.map((v) => ({ v, mp3: files[v].has(`${ch}.mp3`), json: files[v].has(`${ch}.json`) }));
              const partial = cells.some((c) => c.mp3 !== c.json);
              return (
                <tr key={ch} className={`border-b border-border ${partial ? "bg-destructive/15" : ""}`}>
                  <td className="p-2">{ch}</td>
                  {cells.map((c) => (
                    <td key={c.v} className="p-2">
                      {c.mp3 && c.json ? "✓" : c.mp3 ? <span className="text-destructive">missing JSON</span> : c.json ? <span className="text-destructive">missing audio</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
