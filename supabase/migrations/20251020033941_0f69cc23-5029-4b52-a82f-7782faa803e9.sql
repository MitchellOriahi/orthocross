
-- Drop the existing check constraint
ALTER TABLE friend_activities 
DROP CONSTRAINT IF EXISTS friend_activities_activity_type_check;

-- Add updated constraint that includes chapter_completed
ALTER TABLE friend_activities 
ADD CONSTRAINT friend_activities_activity_type_check 
CHECK (activity_type IN ('book_complete', 'saint_complete', 'history_achievement', 'chapter_completed'));
