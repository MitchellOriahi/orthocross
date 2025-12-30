-- Add timezone column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- Create fast_calendar table for storing fast/feast days
CREATE TABLE IF NOT EXISTS public.fast_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  is_fast boolean NOT NULL DEFAULT true,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on fast_calendar
ALTER TABLE public.fast_calendar ENABLE ROW LEVEL SECURITY;

-- Everyone can read the fast calendar
CREATE POLICY "Everyone can view fast calendar" 
ON public.fast_calendar 
FOR SELECT 
USING (true);

-- Only admins can modify fast calendar
CREATE POLICY "Only admins can insert fast calendar" 
ON public.fast_calendar 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update fast calendar" 
ON public.fast_calendar 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete fast calendar" 
ON public.fast_calendar 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create notification_log table for deduplication
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  local_date date NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_log_unique UNIQUE (user_id, type, local_date)
);

-- Enable RLS on notification_log
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- System can insert notifications (from edge functions)
CREATE POLICY "System can insert notification logs" 
ON public.notification_log 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own notification logs
CREATE POLICY "Users can view their own notification logs" 
ON public.notification_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_lookup 
ON public.notification_log (user_id, type, local_date);

CREATE INDEX IF NOT EXISTS idx_fast_calendar_date 
ON public.fast_calendar (date);