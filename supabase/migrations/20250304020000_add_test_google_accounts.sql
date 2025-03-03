-- Migration: Add Test Google Accounts
-- Description: Adds test users with Google authentication for development

-- Declare variables for UUIDs
DO $$
DECLARE
  google_user_id UUID := gen_random_uuid();
  google_creator_id UUID := gen_random_uuid();
  google_lesson_id UUID;
BEGIN

-- Insert test Google users into auth.users
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
)
VALUES
  (
    google_user_id,
    'google-user@example.com',
    '{"full_name":"Google Test User", "avatar_url":"https://lh3.googleusercontent.com/test-avatar", "provider":"google", "providers":["google"]}',
    now(),
    now(),
    now()
  ),
  (
    google_creator_id,
    'google-creator@example.com',
    '{"full_name":"Google Creator", "avatar_url":"https://lh3.googleusercontent.com/creator-avatar", "provider":"google", "providers":["google"]}',
    now(),
    now(),
    now()
  )
ON CONFLICT (email) DO UPDATE 
SET 
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now()
RETURNING id INTO google_user_id, google_creator_id;

-- Insert corresponding identities for Google authentication
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
SELECT 
  id,
  id,
  CASE 
    WHEN email = 'google-user@example.com' THEN 
      '{"sub":"google-oauth2|123456789", "email":"google-user@example.com", "name":"Google Test User"}'
    ELSE 
      '{"sub":"google-oauth2|987654321", "email":"google-creator@example.com", "name":"Google Creator"}'
  END,
  'google',
  now(),
  now()
FROM auth.users
WHERE email IN ('google-user@example.com', 'google-creator@example.com')
ON CONFLICT (id) DO UPDATE 
SET 
  identity_data = EXCLUDED.identity_data,
  updated_at = now();

-- Insert profiles for Google users (in case the trigger doesn't work)
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  bio,
  avatar_url,
  social_media_tag,
  created_at,
  updated_at,
  stripe_account_id
)
SELECT 
  id,
  CASE 
    WHEN email = 'google-user@example.com' THEN 'Google Test User'
    ELSE 'Google Creator'
  END,
  email,
  CASE 
    WHEN email = 'google-user@example.com' THEN 'Test user who signed up with Google'
    ELSE 'Content creator who signed up with Google'
  END,
  CASE 
    WHEN email = 'google-user@example.com' THEN 'https://lh3.googleusercontent.com/test-avatar'
    ELSE 'https://lh3.googleusercontent.com/creator-avatar'
  END,
  CASE 
    WHEN email = 'google-user@example.com' THEN '@google_user'
    ELSE '@google_creator'
  END,
  now(),
  now(),
  CASE 
    WHEN email = 'google-creator@example.com' THEN 'acct_google_test'
    ELSE null
  END
FROM auth.users
WHERE email IN ('google-user@example.com', 'google-creator@example.com')
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  social_media_tag = EXCLUDED.social_media_tag,
  updated_at = now(),
  stripe_account_id = EXCLUDED.stripe_account_id;

-- Add a purchase for the Google user
INSERT INTO purchases (
  id,
  user_id,
  lesson_id,
  creator_id,
  purchase_date,
  stripe_session_id,
  amount,
  platform_fee,
  creator_earnings,
  payment_intent_id,
  fee_percentage,
  status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  '33333333-aaaa-3333-aaaa-333333333333',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  now() - interval '2 days',
  'cs_google_test',
  3499,
  524,
  2975,
  'pi_google_test',
  15,
  'completed'::purchase_status,
  now() - interval '2 days',
  now() - interval '2 days'
FROM auth.users u
WHERE u.email = 'google-user@example.com'
LIMIT 1;

-- Add a lesson for the Google creator
INSERT INTO lessons (
  id,
  title,
  description,
  price,
  creator_id,
  created_at,
  updated_at,
  stripe_product_id,
  stripe_price_id,
  content,
  thumbnail_url,
  is_featured,
  status,
  version,
  mux_asset_id,
  mux_playback_id
)
SELECT 
  gen_random_uuid(),
  'Google Creator Special: Advanced Kendama Techniques',
  'Exclusive techniques shared by our Google-authenticated creator.',
  2999,
  u.id,
  now() - interval '5 days',
  now() - interval '5 days',
  'prod_google_test',
  'price_google_test',
  'This lesson covers exclusive techniques that combine traditional and modern kendama styles.',
  'https://images.unsplash.com/photo-1595429035839-c99c298ffdde',
  true,
  'published'::lesson_status,
  1,
  'muxasset_google',
  'playback_google'
FROM auth.users u
WHERE u.email = 'google-creator@example.com';

-- Connect the Google creator's lesson to categories
INSERT INTO lesson_category (lesson_id, category_id)
SELECT 
  l.id, 
  c.id
FROM lessons l
CROSS JOIN (
  SELECT id FROM categories 
  WHERE id IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
) c
WHERE l.creator_id = (SELECT id FROM auth.users WHERE email = 'google-creator@example.com')
AND l.title = 'Google Creator Special: Advanced Kendama Techniques'
ON CONFLICT (lesson_id, category_id) DO NOTHING;

END $$;
