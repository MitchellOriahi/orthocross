CREATE TABLE public.profile_identity_tags (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 branch text,
 patron_saint_id text,
 country_code text,
 CONSTRAINT profile_identity_branch_length CHECK (branch IS NULL OR length(branch) BETWEEN 1 AND 64),
 CONSTRAINT profile_identity_patron_length CHECK (patron_saint_id IS NULL OR length(patron_saint_id) BETWEEN 1 AND 120),
 CONSTRAINT profile_identity_country_format CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_identity_tags TO authenticated;
GRANT ALL ON public.profile_identity_tags TO service_role;
ALTER TABLE public.profile_identity_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own identity tags" ON public.profile_identity_tags FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own identity tags" ON public.profile_identity_tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own identity tags" ON public.profile_identity_tags FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own identity tags" ON public.profile_identity_tags FOR DELETE TO authenticated USING (auth.uid() = user_id);
COMMENT ON TABLE public.profile_identity_tags IS 'Optional self-description for the profile sticker; never used for authorization or app roles.';