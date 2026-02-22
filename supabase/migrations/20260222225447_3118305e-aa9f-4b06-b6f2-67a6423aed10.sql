
-- Create push_tokens table for native FCM/APNs push notifications
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraints
CREATE UNIQUE INDEX push_tokens_token_unique ON public.push_tokens(token);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own push tokens"
ON public.push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own tokens
CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
