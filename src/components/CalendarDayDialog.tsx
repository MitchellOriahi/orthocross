import { useState } from "react";
import { Bell, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarReminder } from "@/hooks/useCalendarReminders";
import { calendarDateKey, reminderTimestamp } from "@/lib/calendarReminders";
import { toast } from "sonner";

export interface DayEvent { name: string; date: Date; endDate?: Date; type: string }
interface Props {
 date: Date; events: DayEvent[]; weeklyFast: boolean; reminders: CalendarReminder[]; error: boolean;
 onClose: () => void;
 onSave: (input: Omit<CalendarReminder, "id">, id?: string) => Promise<CalendarReminder>;
 onDelete: (id: string) => Promise<void>;
}
export function CalendarDayDialog({ date, events, weeklyFast, reminders, error, onClose, onSave, onDelete }: Props) {
 const [editing, setEditing] = useState(false);
 const [id, setId] = useState<string>();
 const [title, setTitle] = useState("");
 const [notes, setNotes] = useState("");
 const [time, setTime] = useState("09:00");
 const [busy, setBusy] = useState(false);
 const dateKey = calendarDateKey(date);
 const start = (reminder?: CalendarReminder, eventName = "") => {
   setId(reminder?.id); setTitle(reminder?.title ?? eventName); setNotes(reminder?.notes ?? "");
   const at = reminder ? new Date(reminder.remind_at) : null;
   setTime(at ? `${String(at.getHours()).padStart(2,"0")}:${String(at.getMinutes()).padStart(2,"0")}` : "09:00"); setEditing(true);
 };
 const submit = async (e: React.FormEvent) => {
   e.preventDefault();
   const remindAt = reminderTimestamp(dateKey, time);
   if (!title.trim() || !remindAt) { toast.error("Add a title and valid time."); return; }
   if (new Date(remindAt).getTime() <= Date.now()) { toast.error("Choose a time in the future."); return; }
   setBusy(true);
   try { await onSave({ title: title.trim(), notes: notes.trim(), event_date: dateKey, remind_at: remindAt }, id); setEditing(false); toast.success("Reminder saved"); }
   catch (e) { toast.error(e instanceof Error ? e.message : "Could not save reminder."); }
   finally { setBusy(false); }
 };
 const remove = async (reminder: CalendarReminder) => {
   setBusy(true);
   try { await onDelete(reminder.id); toast.success("Reminder deleted"); }
   catch { toast.error("Could not delete reminder. Please try again."); }
   finally { setBusy(false); }
 };
 return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
  <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain">
   <DialogHeader>
    <DialogTitle>{date.toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" })}</DialogTitle>
    <DialogDescription>{date.getFullYear()}</DialogDescription>
   </DialogHeader>
   {editing ? <form onSubmit={submit} className="space-y-4">
     <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={()=>setEditing(false)}><ArrowLeft />Back</Button>
     <div className="space-y-2"><Label htmlFor="reminder-title">Title</Label><Input id="reminder-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={160} required autoFocus placeholder="Personal reminder" /></div>
     <div className="space-y-2"><Label htmlFor="reminder-time">Time</Label><Input type="time" id="reminder-time" value={time} onChange={e=>setTime(e.target.value)} required /></div>
     <div className="space-y-2"><Label htmlFor="reminder-notes">Notes</Label><Textarea id="reminder-notes" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000} rows={3} /></div>
     <Button type="submit" className="w-full" disabled={busy}><Bell />{busy ? "Saving…" : "Save reminder"}</Button>
    </form> : <div className="space-y-5">
      {events.length > 0 && <div className="divide-y divide-border">{events.map((event,index)=><div key={index} className="py-3">
       <div className="min-w-0"><p className="font-semibold break-words">{event.name}</p><p className="text-xs text-muted-foreground capitalize mt-1">{event.type}{event.endDate ? ` · ${event.date.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${event.endDate.toLocaleDateString(undefined,{month:"short",day:"numeric"})}` : ""}</p></div>
      </div>)}</div>}
      {weeklyFast && !events.some(e=>e.type==="feast") && <p className="text-sm text-muted-foreground">Wednesday / Friday fast</p>}
      <div className="space-y-2"><h3 className="text-sm font-semibold">Personal Reminders</h3>
       {error && <p className="text-sm text-destructive">Could not load reminders. Please reopen this date.</p>}
       {!error && reminders.length === 0 && <p className="text-sm text-muted-foreground">No reminders</p>}
       {reminders.map(r=><div key={r.id} className="flex items-start gap-2 border-b border-border py-2">
        <div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{r.title}</p><p className="text-xs text-muted-foreground">{new Date(r.remind_at).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</p>{r.notes && <p className="text-xs mt-1 whitespace-pre-wrap break-words">{r.notes}</p>}</div>
        <Button variant="ghost" size="icon" disabled={busy} aria-label={`Edit ${r.title}`} onClick={()=>start(r)}><Pencil /></Button>
        <Button variant="ghost" size="icon" disabled={busy} aria-label={`Delete ${r.title}`} onClick={()=>remove(r)}><Trash2 /></Button>
       </div>)}
      </div>
      <Button className="w-full" onClick={()=>start()}><Plus />Add reminder</Button>
    </div>}
  </DialogContent>
 </Dialog>;
}
