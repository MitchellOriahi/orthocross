ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE POLICY "Group avatars are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'group-avatars');
CREATE POLICY "Group admins upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'group-avatars' AND public.is_group_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Group admins update avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'group-avatars' AND public.is_group_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Group admins delete avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'group-avatars' AND public.is_group_admin(((storage.foldername(name))[1])::uuid, auth.uid()));