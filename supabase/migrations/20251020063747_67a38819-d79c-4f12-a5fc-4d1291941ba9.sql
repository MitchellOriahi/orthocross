-- Migrate existing phone numbers to auth.users metadata
DO $$
DECLARE
  phone_record RECORD;
BEGIN
  FOR phone_record IN 
    SELECT user_id, phone_number 
    FROM public.user_phone_numbers
  LOOP
    -- Update user metadata with phone number
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('phone_number', phone_record.phone_number)
    WHERE id = phone_record.user_id;
  END LOOP;
END $$;

-- Drop the user_phone_numbers table as phone numbers are now in auth metadata
DROP TABLE IF EXISTS public.user_phone_numbers;