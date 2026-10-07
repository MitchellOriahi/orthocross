CREATE TABLE public.saint_icon_overrides (
  saint_id text PRIMARY KEY,
  image_url text,
  image_source text,
  image_license text,
  image_attribution text,
  focus_x numeric NOT NULL DEFAULT 50,
  focus_y numeric NOT NULL DEFAULT 30,
  zoom numeric NOT NULL DEFAULT 1,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.saint_icon_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saint_icon_overrides TO authenticated;
GRANT ALL ON public.saint_icon_overrides TO service_role;
ALTER TABLE public.saint_icon_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read saint icon overrides" ON public.saint_icon_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert saint icon overrides" ON public.saint_icon_overrides FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update saint icon overrides" ON public.saint_icon_overrides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete saint icon overrides" ON public.saint_icon_overrides FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_saint_icon_overrides_updated_at BEFORE UPDATE ON public.saint_icon_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins upload saint icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'saint-icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update saint icons" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'saint-icons' AND public.has_role(auth.uid(), 'admin'));