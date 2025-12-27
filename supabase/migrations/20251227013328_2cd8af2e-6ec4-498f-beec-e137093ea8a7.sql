-- Add unique constraint to monthly_podium_views for upsert to work
ALTER TABLE public.monthly_podium_views 
ADD CONSTRAINT monthly_podium_views_user_month_unique 
UNIQUE (user_id, month_date);