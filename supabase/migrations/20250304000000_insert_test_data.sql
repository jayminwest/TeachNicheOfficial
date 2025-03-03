-- Migration: Insert Test Data
-- Description: Populates database with realistic test data for development and testing

-- Insert categories
INSERT INTO categories (id, name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Kendama Basics', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Advanced Tricks', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Competition Skills', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'Beginner Tutorials', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'Maintenance & Care', now(), now());

-- Insert test profiles
INSERT INTO profiles (id, full_name, email, bio, avatar_url, social_media_tag, created_at, updated_at, stripe_account_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Creator', 'creator@example.com', 'Professional kendama instructor with 10+ years of experience', 'https://randomuser.me/api/portraits/men/1.jpg', '@kendama_pro', now(), now(), 'acct_test1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Student', 'student@example.com', 'Kendama enthusiast learning new tricks', 'https://randomuser.me/api/portraits/women/1.jpg', '@kendama_student', now(), now(), null),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Admin User', 'admin@example.com', 'Platform administrator', 'https://randomuser.me/api/portraits/men/2.jpg', '@admin', now(), now(), null),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Another Creator', 'creator2@example.com', 'Kendama world champion teaching advanced techniques', 'https://randomuser.me/api/portraits/women/2.jpg', '@kendama_champ', now(), now(), 'acct_test2');

-- Insert lessons
INSERT INTO lessons (id, title, description, price, creator_id, created_at, updated_at, stripe_product_id, stripe_price_id, content, thumbnail_url, is_featured, status, version, mux_asset_id, mux_playback_id)
VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', 'Kendama Basics: Getting Started', 'Learn the fundamentals of kendama play with this comprehensive beginner guide.', 1999, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), 'prod_test1', 'price_test1', 'This lesson covers grip techniques, basic catches, and your first spike.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', true, 'published', 1, 'muxasset1', 'playback1'),
  
  ('22222222-aaaa-2222-aaaa-222222222222', 'Advanced Spikes and Juggles', 'Take your kendama skills to the next level with advanced techniques.', 2499, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), 'prod_test2', 'price_test2', 'Master complex spike variations and learn how to incorporate juggles into your flow.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', false, 'published', 1, 'muxasset2', 'playback2'),
  
  ('33333333-aaaa-3333-aaaa-333333333333', 'Competition Preparation Guide', 'Everything you need to know to prepare for kendama competitions.', 3499, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now(), now(), 'prod_test3', 'price_test3', 'Learn competition formats, judging criteria, and strategies to perform your best under pressure.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', true, 'published', 1, 'muxasset3', 'playback3'),
  
  ('44444444-aaaa-4444-aaaa-444444444444', 'Kendama Maintenance 101', 'Keep your kendama in top condition with these maintenance tips.', 999, 'dddddddd-dddd-dddd-dddd-dddddddddddd', now(), now(), 'prod_test4', 'price_test4', 'Learn how to break in new kendamas, maintain the perfect balance, and extend the life of your equipment.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', false, 'published', 1, 'muxasset4', 'playback4'),
  
  ('55555555-aaaa-5555-aaaa-555555555555', 'Upcoming Trick Showcase', 'Preview of new tricks coming in future lessons.', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), 'prod_test5', 'price_test5', 'This is a draft lesson that will showcase upcoming content.', 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde', false, 'draft', 1, 'muxasset5', 'playback5');

-- Connect lessons to categories
INSERT INTO lesson_category (lesson_id, category_id)
VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('11111111-aaaa-1111-aaaa-111111111111', '44444444-4444-4444-4444-444444444444'),
  ('22222222-aaaa-2222-aaaa-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('33333333-aaaa-3333-aaaa-333333333333', '33333333-3333-3333-3333-333333333333'),
  ('44444444-aaaa-4444-aaaa-444444444444', '55555555-5555-5555-5555-555555555555'),
  ('55555555-aaaa-5555-aaaa-555555555555', '22222222-2222-2222-2222-222222222222');

-- Insert purchases
INSERT INTO purchases (id, user_id, lesson_id, creator_id, purchase_date, stripe_session_id, amount, platform_fee, creator_earnings, payment_intent_id, fee_percentage, status, created_at, updated_at)
VALUES
  ('aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-1111-aaaa-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '10 days', 'cs_test1', 1999, 299, 1700, 'pi_test1', 15, 'completed', now() - interval '10 days', now() - interval '10 days'),
  
  ('bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-aaaa-2222-aaaa-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '5 days', 'cs_test2', 2499, 374, 2125, 'pi_test2', 15, 'completed', now() - interval '5 days', now() - interval '5 days'),
  
  ('cccccccc-3333-cccc-3333-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-aaaa-3333-aaaa-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '3 days', 'cs_test3', 3499, 524, 2975, 'pi_test3', 15, 'completed', now() - interval '3 days', now() - interval '3 days'),
  
  ('dddddddd-4444-dddd-4444-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-aaaa-4444-aaaa-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '1 day', 'cs_test4', 999, 149, 850, 'pi_test4', 15, 'completed', now() - interval '1 day', now() - interval '1 day'),
  
  ('eeeeeeee-5555-eeee-5555-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-aaaa-2222-aaaa-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '12 hours', 'cs_test5', 2499, 374, 2125, 'pi_test5', 15, 'pending', now() - interval '12 hours', now() - interval '12 hours');

-- Insert creator earnings
INSERT INTO creator_earnings (id, creator_id, payment_intent_id, amount, lesson_id, status, created_at, updated_at)
VALUES
  ('11111111-eeee-1111-eeee-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pi_test1', 1700, '11111111-aaaa-1111-aaaa-111111111111', 'paid', now() - interval '9 days', now() - interval '9 days'),
  ('22222222-eeee-2222-eeee-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pi_test2', 2125, '22222222-aaaa-2222-aaaa-222222222222', 'paid', now() - interval '4 days', now() - interval '4 days'),
  ('33333333-eeee-3333-eeee-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'pi_test3', 2975, '33333333-aaaa-3333-aaaa-333333333333', 'paid', now() - interval '2 days', now() - interval '2 days'),
  ('44444444-eeee-4444-eeee-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'pi_test4', 850, '44444444-aaaa-4444-aaaa-444444444444', 'pending', now() - interval '1 day', now() - interval '1 day'),
  ('55555555-eeee-5555-eeee-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pi_test5', 2125, '22222222-aaaa-2222-aaaa-222222222222', 'pending', now() - interval '12 hours', now() - interval '12 hours');

-- Insert reviews
INSERT INTO reviews (id, user_id, lesson_id, rating, comment, created_at, updated_at)
VALUES
  ('rrrr1111-aaaa-1111-aaaa-rrrrrrrrrrrr', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-1111-aaaa-111111111111', 5, 'Excellent introduction to kendama! The instructor explains everything clearly.', now() - interval '8 days', now() - interval '8 days'),
  
  ('rrrr2222-aaaa-2222-aaaa-rrrrrrrrrrrr', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-aaaa-2222-aaaa-222222222222', 4, 'Great advanced techniques, though some parts were a bit too fast-paced.', now() - interval '4 days', now() - interval '4 days'),
  
  ('rrrr3333-aaaa-3333-aaaa-rrrrrrrrrrrr', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-aaaa-3333-aaaa-333333333333', 5, 'This competition guide helped me place in my first tournament!', now() - interval '2 days', now() - interval '2 days'),
  
  ('rrrr4444-aaaa-4444-aaaa-rrrrrrrrrrrr', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-aaaa-4444-aaaa-444444444444', 3, 'Useful maintenance tips, but I wish there were more visual examples.', now() - interval '12 hours', now() - interval '12 hours');

-- Insert lesson requests
INSERT INTO lesson_requests (id, title, description, created_at, user_id, status, vote_count, category, instagram_handle)
VALUES
  ('req11111-1111-1111-1111-req1111111111', 'Lunar Flip Variations', 'Would love to see a detailed breakdown of different lunar flip variations and transitions.', now() - interval '30 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'open', 12, 'Advanced Tricks', '@kendama_student'),
  
  ('req22222-2222-2222-2222-req2222222222', 'Beginner-Friendly String Theory', 'Please create a lesson explaining string theory concepts for complete beginners.', now() - interval '25 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'open', 8, 'Beginner Tutorials', '@admin'),
  
  ('req33333-3333-3333-3333-req3333333333', 'Competition Judging Criteria', 'It would be helpful to understand how judges score different tricks in competitions.', now() - interval '15 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'in_progress', 15, 'Competition Skills', '@kendama_student'),
  
  ('req44444-4444-4444-4444-req4444444444', 'Kendama Selection Guide', 'Could you create a comprehensive guide for selecting the right kendama based on play style?', now() - interval '10 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'open', 7, 'Maintenance & Care', '@admin'),
  
  ('req55555-5555-5555-5555-req5555555555', 'Lighthouse Combo Tutorial', 'Would love to see a tutorial on lighthouse-based combo sequences.', now() - interval '5 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'open', 4, 'Advanced Tricks', '@kendama_student');

-- Insert lesson request votes
INSERT INTO lesson_request_votes (id, request_id, user_id, vote_type, created_at)
VALUES
  ('vote1111-1111-1111-1111-vote1111111', 'req11111-1111-1111-1111-req1111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'up', now() - interval '29 days'),
  ('vote2222-2222-2222-2222-vote2222222', 'req11111-1111-1111-1111-req1111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'up', now() - interval '28 days'),
  ('vote3333-3333-3333-3333-vote3333333', 'req22222-2222-2222-2222-req2222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'up', now() - interval '24 days'),
  ('vote4444-4444-4444-4444-vote4444444', 'req33333-3333-3333-3333-req3333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'up', now() - interval '14 days'),
  ('vote5555-5555-5555-5555-vote5555555', 'req44444-4444-4444-4444-req4444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'up', now() - interval '9 days'),
  ('vote6666-6666-6666-6666-vote6666666', 'req55555-5555-5555-5555-req5555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'up', now() - interval '4 days');

-- Insert waitlist entries
INSERT INTO waitlist (id, email, signed_up_at, created_at)
VALUES
  ('wait1111-1111-1111-1111-wait1111111', 'interested1@example.com', now() - interval '60 days', now() - interval '60 days'),
  ('wait2222-2222-2222-2222-wait2222222', 'interested2@example.com', now() - interval '45 days', now() - interval '45 days'),
  ('wait3333-3333-3333-3333-wait3333333', 'interested3@example.com', now() - interval '30 days', now() - interval '30 days'),
  ('wait4444-4444-4444-4444-wait4444444', 'interested4@example.com', now() - interval '15 days', now() - interval '15 days'),
  ('wait5555-5555-5555-5555-wait5555555', 'interested5@example.com', now() - interval '7 days', now() - interval '7 days');

-- Create storage buckets if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_tables 
        WHERE schemaname = 'storage' 
        AND tablename = 'buckets'
    ) THEN
        -- Storage extension might not be enabled yet
        RAISE NOTICE 'Storage schema not found. Skipping bucket creation.';
    ELSE
        -- Insert lesson-media bucket if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'lesson-media'
        ) THEN
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('lesson-media', 'lesson-media', true);
            
            -- Set up storage policy for lesson-media
            INSERT INTO storage.policies (name, bucket_id, operation, expression)
            VALUES 
                ('Public Read Access', 'lesson-media', 'SELECT', 'true'),
                ('Creator Upload Access', 'lesson-media', 'INSERT', '(auth.uid() = creator_id)'),
                ('Creator Update Access', 'lesson-media', 'UPDATE', '(auth.uid() = creator_id)'),
                ('Creator Delete Access', 'lesson-media', 'DELETE', '(auth.uid() = creator_id)');
        END IF;
        
        -- Insert user-media bucket if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'user-media'
        ) THEN
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('user-media', 'user-media', true);
            
            -- Set up storage policy for user-media
            INSERT INTO storage.policies (name, bucket_id, operation, expression)
            VALUES 
                ('Public Read Access', 'user-media', 'SELECT', 'true'),
                ('Owner Upload Access', 'user-media', 'INSERT', '(auth.uid() = owner)'),
                ('Owner Update Access', 'user-media', 'UPDATE', '(auth.uid() = owner)'),
                ('Owner Delete Access', 'user-media', 'DELETE', '(auth.uid() = owner)');
        END IF;
    END IF;
END $$;

-- Insert sample objects into storage buckets (metadata only)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_tables 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    ) THEN
        -- Insert sample lesson thumbnails
        INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at)
        VALUES
            ('lesson-media', 'thumbnails/kendama-basics.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 256000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '30 days'),
            ('lesson-media', 'thumbnails/advanced-spikes.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 312000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '25 days'),
            ('lesson-media', 'thumbnails/competition-guide.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"size": 287000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '20 days'),
            ('lesson-media', 'thumbnails/maintenance-101.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"size": 198000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '15 days'),
            ('lesson-media', 'thumbnails/upcoming-tricks.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 245000, "mimetype": "image/jpeg", "width": 1280, "height": 720}', now() - interval '10 days');
            
        -- Insert sample user avatars
        INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at)
        VALUES
            ('user-media', 'avatars/creator1.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"size": 124000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '45 days'),
            ('user-media', 'avatars/student1.jpg', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"size": 118000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '40 days'),
            ('user-media', 'avatars/admin1.jpg', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '{"size": 132000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '35 days'),
            ('user-media', 'avatars/creator2.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"size": 127000, "mimetype": "image/jpeg", "width": 512, "height": 512}', now() - interval '30 days');
    END IF;
END $$;
