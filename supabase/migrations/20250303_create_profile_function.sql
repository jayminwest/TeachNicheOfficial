-- This is a renamed version of 20250303000000_create_profile_function.sql
-- We're keeping this file with only the function to avoid duplicate policies

-- Create a function to safely create profiles with proper permissions
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  user_full_name TEXT,
  user_bio TEXT,
  user_social_media TEXT,
  user_email TEXT
) RETURNS VOID AS $$
BEGIN
  -- This function runs with the permissions of the calling user
  -- Make sure the user can only modify their own profile
  IF auth.uid() = user_id THEN
    INSERT INTO profiles (
      id, 
      full_name, 
      bio, 
      social_media_tag, 
      email,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_full_name,
      user_bio,
      user_social_media,
      user_email,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = user_full_name,
      bio = user_bio,
      social_media_tag = user_social_media,
      email = user_email,
      updated_at = NOW();
  ELSE
    RAISE EXCEPTION 'You can only modify your own profile';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
