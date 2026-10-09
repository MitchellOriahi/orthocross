REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.friend_donation_notifications FROM anon, authenticated;
REVOKE SELECT, UPDATE ON public.friend_donation_notifications FROM anon;