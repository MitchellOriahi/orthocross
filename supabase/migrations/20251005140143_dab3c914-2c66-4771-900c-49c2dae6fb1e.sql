-- Add reminder_days_before column to fasting_reminders table
ALTER TABLE fasting_reminders 
ADD COLUMN reminder_days_before integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN fasting_reminders.reminder_days_before IS 'Number of days before the event to start sending reminders: 0 = day of, 1 = 1 day before, 2 = 2 days before, 3 = 3 days before';