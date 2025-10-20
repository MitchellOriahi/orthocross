
-- Drop the existing check constraint
ALTER TABLE friend_activities 
DROP CONSTRAINT IF EXISTS friend_activities_activity_type_check;

-- Add updated constraint with all activity types
ALTER TABLE friend_activities 
ADD CONSTRAINT friend_activities_activity_type_check 
CHECK (activity_type IN (
  'chapter_completed',
  'book_completed', 
  'bible_completed',
  'saint_completed',
  'island_completed'
));
