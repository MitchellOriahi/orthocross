-- Make profile-pictures bucket private for better security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'profile-pictures';

-- Drop any existing policies on storage.objects for profile-pictures bucket
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Add RLS policies for profile-pictures bucket
CREATE POLICY "Users can upload own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to profile pictures (authenticated or not)
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');