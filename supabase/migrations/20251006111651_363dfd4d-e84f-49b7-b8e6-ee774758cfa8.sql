-- Drop the old unique constraint that doesn't include filter_context
ALTER TABLE pinned_prayers
DROP CONSTRAINT IF EXISTS pinned_prayers_user_id_prayer_id_key;

-- Add new unique constraint that includes filter_context
ALTER TABLE pinned_prayers
ADD CONSTRAINT pinned_prayers_user_id_prayer_id_filter_context_key 
UNIQUE (user_id, prayer_id, filter_context);