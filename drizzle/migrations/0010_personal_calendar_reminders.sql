CREATE TABLE public.calendar_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
 notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
 event_date date NOT NULL,
 remind_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_reminders TO authenticated;
GRANT ALL ON public.calendar_reminders TO service_role;
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own calendar reminders" ON public.calendar_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own calendar reminders" ON public.calendar_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users edit own calendar reminders" ON public.calendar_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own calendar reminders" ON public.calendar_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX calendar_reminders_user_date_idx ON public.calendar_reminders(user_id, event_date);