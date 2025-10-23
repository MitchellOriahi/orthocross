-- Make profile-pictures bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-pictures';