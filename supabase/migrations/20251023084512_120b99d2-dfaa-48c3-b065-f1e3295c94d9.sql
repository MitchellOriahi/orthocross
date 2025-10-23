-- Add voice recording preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_recording_enabled BOOLEAN DEFAULT false;

-- Update existing users to have voice recording disabled by default
UPDATE profiles SET voice_recording_enabled = false WHERE voice_recording_enabled IS NULL;