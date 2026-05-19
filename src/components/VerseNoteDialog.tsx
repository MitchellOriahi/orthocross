import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Mic, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { VoiceRecorder } from "./journal/VoiceRecorder";
import { DrawingCanvas } from "./journal/DrawingCanvas";

interface VerseNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
}

const FOLDER_NAME = "Verse Notes";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const VerseNoteDialog = ({
  open,
  onOpenChange,
  book,
  bookName,
  chapter,
  verseNumber,
  verseText,
}: VerseNoteDialogProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"text" | "voice" | "drawing">("text");
  const [noteText, setNoteText] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNoteText("");
    setAudioBlob(null);
    setDrawingDataUrl(null);
    setTab("text");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const ensureFolderId = async (): Promise<string | null> => {
    if (!user) return null;
    const { data: existing } = await supabase
      .from("journal_folders")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", FOLDER_NAME)
      .maybeSingle();
    if (existing?.id) return existing.id;
    const { data: created } = await supabase
      .from("journal_folders")
      .insert({ user_id: user.id, name: FOLDER_NAME })
      .select("id")
      .single();
    return created?.id ?? null;
  };

  const uploadBlob = async (
    blob: Blob,
    noteId: string,
    ext: string,
    prefix: string
  ): Promise<string | null> => {
    if (!user) return null;
    const fileName = `${user.id}/${noteId}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("journal-attachments").upload(fileName, blob);
    if (error) throw error;
    const { data } = await supabase.storage
      .from("journal-attachments")
      .createSignedUrl(fileName, 31536000);
    return data?.signedUrl ?? null;
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save notes");
      return;
    }
    const hasAny = noteText.trim() || audioBlob || drawingDataUrl;
    if (!hasAny) {
      toast.error("Add a note, recording, or drawing first");
      return;
    }

    setSaving(true);
    try {
      const folderId = await ensureFolderId();
      const title = `${bookName} ${chapter}:${verseNumber}`;
      const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const verseBlock =
        `<div class="flex items-baseline justify-between mb-2">` +
          `<h2 class="text-xl font-semibold text-primary m-0">${escapeHtml(title)}</h2>` +
          `<span class="text-sm text-muted-foreground">${escapeHtml(today)}</span>` +
        `</div>` +
        `<hr class="border-t border-border my-2" />` +
        `<p class="text-2xl leading-snug my-4">${escapeHtml(verseText)}</p>`;

      // Create note first (need id for storage path)
      const { data: note, error: noteErr } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          folder_id: folderId,
          title,
          content: verseBlock,
        })
        .select()
        .single();
      if (noteErr || !note) throw noteErr || new Error("Failed to create note");

      let extra = "";

      if (noteText.trim()) {
        extra += `<blockquote class="border-l-4 border-destructive pl-3 my-3 text-base">${escapeHtml(noteText).replace(/\n/g, "<br/>")}</blockquote>`;
      }

      if (drawingDataUrl) {
        const res = await fetch(drawingDataUrl);
        const blob = await res.blob();
        const url = await uploadBlob(blob, note.id, "png", "drawing");
        if (url) {
          extra += `<div class="my-4"><img src="${url}" alt="Drawing" class="max-w-full rounded-lg border border-border" /></div>`;
        }
      }

      if (audioBlob) {
        const url = await uploadBlob(audioBlob, note.id, "webm", "voice");
        if (url) {
          extra += `<div class="my-4"><audio src="${url}" controls class="w-full"></audio></div>`;
        }
      }

      await supabase
        .from("journal_entries")
        .update({ content: verseBlock + extra, updated_at: new Date().toISOString() })
        .eq("id", note.id);

      toast.success("Saved to journal");
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving verse note:", err);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Note on {bookName} {chapter}:{verseNumber}</DialogTitle>
        </DialogHeader>

        <blockquote className="border-l-4 border-primary pl-3 italic text-sm text-muted-foreground">
          {verseText}
        </blockquote>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2" />Note</TabsTrigger>
            <TabsTrigger value="voice"><Mic className="w-4 h-4 mr-2" />Voice</TabsTrigger>
            <TabsTrigger value="drawing"><Pencil className="w-4 h-4 mr-2" />Draw</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your thoughts about this verse..."
              className="min-h-[160px]"
            />
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <VoiceRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />
            {audioBlob && (
              <p className="text-xs text-muted-foreground mt-2">Recording ready to save.</p>
            )}
          </TabsContent>

          <TabsContent value="drawing" className="mt-4">
            <div className="h-[450px]">
              <DrawingCanvas onSave={(dataUrl) => { setDrawingDataUrl(dataUrl); toast.success("Drawing captured"); }} />
            </div>
            {drawingDataUrl && (
              <p className="text-xs text-muted-foreground mt-2">Drawing ready to save.</p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save to Journal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
