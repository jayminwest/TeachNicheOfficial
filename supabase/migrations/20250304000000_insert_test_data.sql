-- Migration: Insert Test Data
-- Description: Populates database with realistic test data for development and testing

-- Insert categories
INSERT INTO categories (id, name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Kendama Basics', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Advanced Tricks', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Competition Skills', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'Beginner Tutorials', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'Maintenance & Care', now(), now())
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  updated_at = now();

-- Insert test profiles
INSERT INTO profiles (id, full_name, email, bio, avatar_url, social_media_tag, created_at, updated_at, stripe_account_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Creator', 'creator@example.com', 'Professional kendama instructor with 10+ years of experience', 'https://randomuser.me/api/portraits/men/1.jpg', '@kendama_pro', now(), now(), 'acct_test1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Student', 'student@example.com', 'Kendama enthusiast learning new tricks', 'https://randomuser.me/api/portraits/women/1.jpg', '@kendama_student', now(), now(), null),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Admin User', 'admin@example.com', 'Platform administrator', 'https://randomuser.me/api/portraits/men/2.jpg', '@admin', now(), now(), null),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Another Creator', 'creator2@example.com', 'Kendama world champion teaching advanced techniques', 'https://randomuser.me/api/portraits/women/2.jpg', '@kendama_champ', now(), now(), 'acct_test2')
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  social_media_tag = EXCLUDED.social_media_tag,
  updated_at = now(),
  stripe_account_id = EXCLUDED.stripe_account_id;

-- Insert lessons
INSERT INTO lessons (id, title, description, price, creator_id, created_at, updated_at, stripe_product_id, stripe_price_id, content, thumbnail_url, is_featured, status, version, mux_asset_id, mux_playback_id)
VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', 'Kendama Basics: Getting Started', 'Learn the fundamentals of kendama play with this comprehensive beginner guide.', 1999, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), 'prod_test1', 'price_test1', 'This lesson covers grip techniques, basic catches, and your first spike.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', true, 'published', 1, 'muxasset1', 'playback1'),
  
  ('22222222-aaaa-2222-aaaa-222222222222', 'Advanced Spikes and Juggles', 'Take your kendama skills to the next level with advanced techniques.', 2499, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), 'prod_test2', 'price_test2', 'Master complex spike variations and learn how to incorporate juggles into your flow.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', false, 'published', 1, 'muxasset2', 'playback2'),
  
  ('33333333-aaaa-3333-aaaa-333333333333', 'Competition Preparation Guide', 'Everything you need to know to prepare for kendama competitions.', 3499, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now(), now(), 'prod_test3', 'price_test3', 'Learn competition formats, judging criteria, and strategies to perform your best under pressure.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', true, 'published', 1, 'muxasset3', 'playback3'),
  
  ('44444444-aaaa-4444-aaaa-444444444444', 'Kendama Maintenance 101', 'Keep your kendama in top condition with these maintenance tips.', 999, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now(), now(), 'prod_test4', 'price_test4', 'Learn how to break in new kendamas, maintain the perfect balance, and extend the life of your equipment.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', false, 'published', 1, 'muxasset4', 'playback4'),
  
  ('55555555-aaaa-5555-aaaa-555555555555', 'Upcoming Trick Showcase', 'Preview of new tricks coming in future lessons.', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), 'prod_test5', 'price_test5', 'This is a draft lesson that will showcase upcoming content.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', false, 'draft', 1, 'muxasset5', 'playback5')
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

-- Connect lessons to categories
INSERT INTO lesson_category (lesson_id, category_id)
VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('11111111-aaaa-1111-aaaa-111111111111', '44444444-4444-4444-4444-444444444444'),
  ('22222222-aaaa-2222-aaaa-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('33333333-aaaa-3333-aaaa-333333333333', '33333333-3333-3333-3333-333333333333'),
  ('44444444-aaaa-4444-aaaa-444444444444', '55555555-5555-5555-5555-555555555555'),
  ('55555555-aaaa-5555-aaaa-555555555555', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (lesson_id, category_id) DO NOTHING;

-- Insert purchases
INSERT INTO purchases (id, user_id, lesson_id, creator_id, purchase_date, stripe_session_id, amount, platform_fee, creator_earnings, payment_intent_id, fee_percentage, status, created_at, updated_at)
VALUES
  ('aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-1111-aaaa-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '10 days', 'cs_test1', 1999, 299, 1700, 'pi_test1', 15, 'completed', now() - interval '10 days', now() - interval '10 days'),
  
  ('bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-aaaa-2222-aaaa-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '5 days', 'cs_test2', 2499, 374, 2125, 'pi_test2', 15, 'completed', now() - interval '5 days', now() - interval '5 days'),
  
  ('cccccccc-3333-cccc-3333-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-aaaa-3333-aaaa-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '3 days', 'cs_test3', 3499, 524, 2975, 'pi_test3', 15, 'completed', now() - interval '3 days', now() - interval '3 days'),
  
  ('dddddddd-4444-dddd-4444-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-aaaa-4444-aaaa-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '1 day', 'cs_test4', 999, 149, 850, 'pi_test4', 15, 'completed', now() - interval '1 day', now() - interval '1 day'),
  
  ('eeeeeeee-5555-eeee-5555-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-aaaa-2222-aaaa-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '12 hours', 'cs_test5', 2499, 374, 2125, 'pi_test5', 15, 'pending', now() - interval '12 hours', now() - interval '12 hours')
ON CONFLICT (id) DO UPDATE 
SET 
  user_id = EXCLUDED.user_id,
  lesson_id = EXCLUDED.lesson_id,
  creator_id = EXCLUDED.creator_id,
  purchase_date = EXCLUDED.purchase_date,
  stripe_session_id = EXCLUDED.stripe_session_id,
  amount = EXCLUDED.amount,
  platform_fee = EXCLUDED.platform_fee,
  creator_earnings = EXCLUDED.creator_earnings,
  payment_intent_id = EXCLUDED.payment_intent_id,
  fee_percentage = EXCLUDED.fee_percentage,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert creator earnings
INSERT INTO creator_earnings (creator_id, payment_intent_id, amount, lesson_id, status, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pi_test1', 1700, '11111111-aaaa-1111-aaaa-111111111111', 'paid', now() - interval '9 days', now() - interval '9 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pi_test2', 2125, '22222222-aaaa-2222-aaaa-222222222222', 'paid', now() - interval '4 days', now() - interval '4 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pi_test3', 2975, '33333333-aaaa-3333-aaaa-333333333333', 'paid', now() - interval '2 days', now() - interval '2 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pi_test4', 850, '44444444-aaaa-4444-aaaa-444444444444', 'pending', now() - interval '1 day', now() - interval '1 day'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pi_test5', 2125, '22222222-aaaa-2222-aaaa-222222222222', 'pending', now() - interval '12 hours', now() - interval '12 hours')
ON CONFLICT (id) DO UPDATE 
SET 
  creator_id = EXCLUDED.creator_id,
  payment_intent_id = EXCLUDED.payment_intent_id,
  amount = EXCLUDED.amount,
  lesson_id = EXCLUDED.lesson_id,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert reviews
INSERT INTO reviews (id, user_id, lesson_id, rating, comment, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-1111-aaaa-111111111111', 5, 'Excellent introduction to kendama! The instructor explains everything clearly.', now() - interval '8 days', now() - interval '8 days'),
  
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-aaaa-2222-aaaa-222222222222', 4, 'Great advanced techniques, though some parts were a bit too fast-paced.', now() - interval '4 days', now() - interval '4 days'),
  
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-aaaa-3333-aaaa-333333333333', 5, 'This competition guide helped me place in my first tournament!', now() - interval '2 days', now() - interval '2 days'),
  
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-aaaa-4444-aaaa-444444444444', 3, 'Useful maintenance tips, but I wish there were more visual examples.', now() - interval '12 hours', now() - interval '12 hours');

-- Insert lesson requests
INSERT INTO lesson_requests (id, title, description, created_at, user_id, status, vote_count, category, instagram_handle)
VALUES
  (gen_random_uuid(), 'Lunar Flip Variations', 'Would love to see a detailed breakdown of different lunar flip variations and transitions.', now() - interval '30 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'open', 12, 'Advanced Tricks', '@kendama_student'),
  
  (gen_random_uuid(), 'Beginner-Friendly String Theory', 'Please create a lesson explaining string theory concepts for complete beginners.', now() - interval '25 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'open', 8, 'Beginner Tutorials', '@admin'),
  
  (gen_random_uuid(), 'Competition Judging Criteria', 'It would be helpful to understand how judges score different tricks in competitions.', now() - interval '15 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'in_progress', 15, 'Competition Skills', '@kendama_student'),
  
  (gen_random_uuid(), 'Kendama Selection Guide', 'Could you create a comprehensive guide for selecting the right kendama based on play style?', now() - interval '10 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'open', 7, 'Maintenance & Care', '@admin'),
  
  (gen_random_uuid(), 'Lighthouse Combo Tutorial', 'Would love to see a tutorial on lighthouse-based combo sequences.', now() - interval '5 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'open', 4, 'Advanced Tricks', '@kendama_student');

-- Insert lesson request votes
-- We need to get the IDs of the lesson requests we just inserted
WITH request_ids AS (
  SELECT id FROM lesson_requests ORDER BY created_at DESC LIMIT 5
)
INSERT INTO lesson_request_votes (id, request_id, user_id, vote_type, created_at)
SELECT 
  gen_random_uuid(),
  id,
  CASE WHEN row_number() OVER (ORDER BY id) % 2 = 0 THEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid ELSE 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid END,
  'up',
  now() - (row_number() OVER (ORDER BY id) * interval '5 days')
FROM request_ids;

-- Add a few more votes to make some requests more popular
WITH request_ids AS (
  SELECT id FROM lesson_requests ORDER BY created_at DESC LIMIT 3
)
INSERT INTO lesson_request_votes (id, request_id, user_id, vote_type, created_at)
SELECT 
  gen_random_uuid(),
  id,
  CASE WHEN row_number() OVER (ORDER BY id) % 2 = 0 THEN 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid ELSE 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid END,
  'up',
  now() - (row_number() OVER (ORDER BY id) * interval '3 days')
FROM request_ids;

-- Insert waitlist entries
INSERT INTO waitlist (id, email, signed_up_at, created_at)
VALUES
  (gen_random_uuid(), 'interested1@example.com', now() - interval '60 days', now() - interval '60 days'),
  (gen_random_uuid(), 'interested2@example.com', now() - interval '45 days', now() - interval '45 days'),
  (gen_random_uuid(), 'interested3@example.com', now() - interval '30 days', now() - interval '30 days'),
  (gen_random_uuid(), 'interested4@example.com', now() - interval '15 days', now() - interval '15 days'),
  (gen_random_uuid(), 'interested5@example.com', now() - interval '7 days', now() - interval '7 days');

-- Create storage buckets if they don't exist
DO $$
BEGIN
    -- Check if storage schema exists
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'storage'
    ) THEN
        -- Check if buckets table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'storage' 
            AND table_name = 'buckets'
        ) THEN
            -- Insert lesson-media bucket if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM storage.buckets WHERE name = 'lesson-media'
            ) THEN
                INSERT INTO storage.buckets (id, name, public)
                VALUES ('lesson-media', 'lesson-media', true);
                
                -- Check if policies table exists before inserting
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'storage' 
                    AND table_name = 'policies'
                ) THEN
                    -- Set up storage policy for lesson-media
                    INSERT INTO storage.policies (name, bucket_id, operation, expression)
                    VALUES 
                        ('Public Read Access', 'lesson-media', 'SELECT', 'true'),
                        ('Creator Upload Access', 'lesson-media', 'INSERT', '(auth.uid() = creator_id)'),
                        ('Creator Update Access', 'lesson-media', 'UPDATE', '(auth.uid() = creator_id)'),
                        ('Creator Delete Access', 'lesson-media', 'DELETE', '(auth.uid() = creator_id)');
                END IF;
            END IF;
            
            -- Insert user-media bucket if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM storage.buckets WHERE name = 'user-media'
            ) THEN
                INSERT INTO storage.buckets (id, name, public)
                VALUES ('user-media', 'user-media', true);
                
                -- Check if policies table exists before inserting
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'storage' 
                    AND table_name = 'policies'
                ) THEN
                    -- Set up storage policy for user-media
                    INSERT INTO storage.policies (name, bucket_id, operation, expression)
                    VALUES 
                        ('Public Read Access', 'user-media', 'SELECT', 'true'),
                        ('Owner Upload Access', 'user-media', 'INSERT', '(auth.uid() = owner)'),
                        ('Owner Update Access', 'user-media', 'UPDATE', '(auth.uid() = owner)'),
                        ('Owner Delete Access', 'user-media', 'DELETE', '(auth.uid() = owner)');
                END IF;
            END IF;
        ELSE
            RAISE NOTICE 'Storage buckets table not found. Skipping bucket creation.';
        END IF;
    ELSE
        RAISE NOTICE 'Storage schema not found. Skipping bucket creation.';
    END IF;
END $$;

-- Insert sample objects into storage buckets (metadata only)
DO $$
BEGIN
    -- Check if storage schema and objects table exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' 
        AND table_name = 'objects'
    ) THEN
        -- Insert sample lesson thumbnails with ON CONFLICT DO NOTHING
        INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at)
        VALUES
            ('lesson-media', 'thumbnails/kendama-basics.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 256000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '30 days'),
            ('lesson-media', 'thumbnails/advanced-spikes.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 312000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '25 days'),
            ('lesson-media', 'thumbnails/competition-guide.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"size": 287000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '20 days'),
            ('lesson-media', 'thumbnails/maintenance-101.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"size": 198000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '15 days'),
            ('lesson-media', 'thumbnails/upcoming-tricks.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 245000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '10 days')
        ON CONFLICT (bucket_id, name) DO NOTHING;
            
        -- Insert sample user avatars with ON CONFLICT DO NOTHING
        INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at)
        VALUES
            ('user-media', 'avatars/creator1.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 124000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '45 days'),
            ('user-media', 'avatars/student1.jpg', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"size": 118000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '40 days'),
            ('user-media', 'avatars/admin1.jpg', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '{"size": 132000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '35 days'),
            ('user-media', 'avatars/creator2.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"size": 127000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '30 days')
        ON CONFLICT (bucket_id, name) DO NOTHING;
    ELSE
        RAISE NOTICE 'Storage objects table not found. Skipping sample objects insertion.';
    END IF;
END $$;
