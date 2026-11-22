DROP POLICY IF EXISTS "Signed-in users can read saint icon overrides" ON public.saint_icon_overrides;
DROP POLICY IF EXISTS "Anyone can read saint icon overrides" ON public.saint_icon_overrides;
REVOKE SELECT ON public.saint_icon_overrides FROM anon;

CREATE POLICY "Admins read saint icon overrides"
  ON public.saint_icon_overrides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_saint_icon_overrides()
RETURNS TABLE(
  saint_id text,
  image_url text,
  image_source text,
  image_license text,
  image_attribution text,
  focus_x numeric,
  focus_y numeric,
  zoom numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.saint_id, o.image_url, o.image_source, o.image_license, o.image_attribution, o.focus_x, o.focus_y, o.zoom
  FROM public.saint_icon_overrides o
  WHERE auth.uid() IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.get_saint_icon_overrides() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_saint_icon_overrides() TO authenticated;