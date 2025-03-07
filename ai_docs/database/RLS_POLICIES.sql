-- RLS Policies for Teach Niche Database
-- Run these commands on your dev database to recreate the same RLS policies as production

-- First, drop all existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Categories policies
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT TO public USING (true);

-- Lesson request votes policies
CREATE POLICY "Allow anyone to read votes" ON public.lesson_request_votes FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to create votes" ON public.lesson_request_votes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow users to delete their own votes" ON public.lesson_request_votes FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can delete their own votes" ON public.lesson_request_votes FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can insert their own votes" ON public.lesson_request_votes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can update their own votes" ON public.lesson_request_votes FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can view votes" ON public.lesson_request_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only authenticated users can vote" ON public.lesson_request_votes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lesson requests policies
CREATE POLICY "Allow anyone to read requests" ON public.lesson_requests FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to create requests" ON public.lesson_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow users to delete their own requests" ON public.lesson_requests FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Allow users to update their own requests" ON public.lesson_requests FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can create requests" ON public.lesson_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Enable insert access for authenticated users" ON public.lesson_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Enable insert for authenticated users only" ON public.lesson_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Requests are viewable by everyone" ON public.lesson_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create their own requests" ON public.lesson_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own requests" ON public.lesson_requests FOR UPDATE TO authenticated USING ((auth.uid() = user_id));

-- Lessons policies
CREATE POLICY "Anyone can view published lessons" ON public.lessons FOR SELECT TO public USING (((status = 'published'::lesson_status) AND (deleted_at IS NULL)));
CREATE POLICY "Users can create their own lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK ((auth.uid() = creator_id));
CREATE POLICY "Users can delete their own lessons" ON public.lessons FOR DELETE TO authenticated USING ((auth.uid() = creator_id));
CREATE POLICY "Users can update their own lessons" ON public.lessons FOR UPDATE TO authenticated USING ((auth.uid() = creator_id)) WITH CHECK ((auth.uid() = creator_id));
CREATE POLICY "Users can view all their own lessons" ON public.lessons FOR SELECT TO authenticated USING ((auth.uid() = creator_id));

-- Profiles policies
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO public USING ((auth.uid() = id));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO public USING ((auth.uid() = id));
CREATE POLICY insert_own_profile ON public.profiles FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY select_own_profile ON public.profiles FOR SELECT TO public USING ((auth.uid() = id));
CREATE POLICY update_own_profile ON public.profiles FOR UPDATE TO public USING ((auth.uid() = id));

-- Purchases policies
CREATE POLICY "Allow all operations for service role" ON public.purchases FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON public.purchases FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow updates to purchases via webhooks" ON public.purchases FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Creators can view purchases for their lessons" ON public.purchases FOR SELECT TO public USING ((auth.uid() = creator_id));
CREATE POLICY "Creators can view purchases for their lessons." ON public.purchases FOR SELECT TO authenticated USING ((auth.uid() = creator_id));
CREATE POLICY "Creators can view purchases of their lessons" ON public.purchases FOR SELECT TO authenticated USING ((auth.uid() = creator_id));
CREATE POLICY "Users can create their own purchase records" ON public.purchases FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own purchase records" ON public.purchases FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own purchases" ON public.purchases FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own purchases." ON public.purchases FOR SELECT TO authenticated USING ((auth.uid() = user_id));

-- Waitlist policies
CREATE POLICY "Enable insert for all users" ON public.waitlist FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users only" ON public.waitlist FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

-- Make sure RLS is enabled on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    ) 
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable RLS on table %', r.tablename;
        END;
    END LOOP;
END $$;
