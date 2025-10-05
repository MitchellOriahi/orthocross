-- Create table for storing user fasting reminders
CREATE TABLE public.fasting_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_tradition TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('fast', 'feast')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_name, event_date, event_tradition)
);

-- Enable Row Level Security
ALTER TABLE public.fasting_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own reminders" 
ON public.fasting_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
ON public.fasting_reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.fasting_reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_fasting_reminders_user_id ON public.fasting_reminders(user_id);
CREATE INDEX idx_fasting_reminders_event_date ON public.fasting_reminders(event_date);