-- Add username and profile_picture_url to profiles table
ALTER TABLE public.profiles
ADD COLUMN username text UNIQUE,
ADD COLUMN profile_picture_url text;

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add a check constraint to ensure username format (alphanumeric, underscore, hyphen, 3-20 chars)
ALTER TABLE public.profiles
ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,20}$');