-- Add filter_context column to pinned_prayers table
ALTER TABLE pinned_prayers
ADD COLUMN filter_context text NOT NULL DEFAULT 'all';

-- Add check constraint to ensure valid filter contexts
ALTER TABLE pinned_prayers
ADD CONSTRAINT valid_filter_context 
CHECK (filter_context IN ('all', 'Eastern', 'Oriental'));