-- Function to find existing DM conversation between two users
CREATE OR REPLACE FUNCTION public.find_dm_conversation(user_a UUID, user_b UUID)
RETURNS TABLE(id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
  WHERE c.type = 'dm'
    AND cp1.user_id = user_a
    AND cp2.user_id = user_b
    AND cp1.user_id != cp2.user_id
  LIMIT 1;
$$;