-- Migration: Add Test Google Accounts
-- Description: Adds test users with Google authentication for development

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
    'aaaaaaaa-aaaa-aaaa-aaaa-gggggggggggg',
    'google-user@example.com',
    '{"full_name":"Google Test User", "avatar_url":"https://lh3.googleusercontent.com/test-avatar", "provider":"google", "providers":["google"]}',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-hhhhhhhhhhhh',
    'google-creator@example.com',
    '{"full_name":"Google Creator", "avatar_url":"https://lh3.googleusercontent.com/creator-avatar", "provider":"google", "providers":["google"]}',
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Insert corresponding identities for Google authentication
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-gggggggggggg',
    'aaaaaaaa-aaaa-aaaa-aaaa-gggggggggggg',
    '{"sub":"google-oauth2|123456789", "email":"google-user@example.com", "name":"Google Test User"}',
    'google',
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-hhhhhhhhhhhh',
    'bbbbbbbb-bbbb-bbbb-bbbb-hhhhhhhhhhhh',
    '{"sub":"google-oauth2|987654321", "email":"google-creator@example.com", "name":"Google Creator"}',
    'google',
    now(),
    now()
  )
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
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-gggggggggggg',
    'Google Test User',
    'google-user@example.com',
    'Test user who signed up with Google',
    'https://lh3.googleusercontent.com/test-avatar',
    '@google_user',
    now(),
    now(),
    null
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-hhhhhhhhhhhh',
    'Google Creator',
    'google-creator@example.com',
    'Content creator who signed up with Google',
    'https://lh3.googleusercontent.com/creator-avatar',
    '@google_creator',
    now(),
    now(),
    'acct_google_test'
  )
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
VALUES
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-gggggggggggg',
    '33333333-aaaa-3333-aaaa-333333333333',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    now() - interval '2 days',
    'cs_google_test',
    3499,
    524,
    2975,
    'pi_google_test',
    15,
    'completed',
    now() - interval '2 days',
    now() - interval '2 days'
  )
ON CONFLICT (id) DO NOTHING;

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
VALUES
  (
    '66666666-6666-6666-6666-666666666666',
    'Google Creator Special: Advanced Kendama Techniques',
    'Exclusive techniques shared by our Google-authenticated creator.',
    2999,
    'bbbbbbbb-bbbb-bbbb-bbbb-hhhhhhhhhhhh',
    now() - interval '5 days',
    now() - interval '5 days',
    'prod_google_test',
    'price_google_test',
    'This lesson covers exclusive techniques that combine traditional and modern kendama styles.',
    'https://images.unsplash.com/photo-1595429035839-c99c298ffdde',
    true,
    'published',
    1,
    'muxasset_google',
    'playback_google'
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  updated_at = now(),
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  content = EXCLUDED.content,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  status = EXCLUDED.status,
  version = EXCLUDED.version,
  mux_asset_id = EXCLUDED.mux_asset_id,
  mux_playback_id = EXCLUDED.mux_playback_id;

-- Connect the Google creator's lesson to categories
INSERT INTO lesson_category (lesson_id, category_id)
VALUES
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222'),
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (lesson_id, category_id) DO NOTHING;
