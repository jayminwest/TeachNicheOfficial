-- Check and fix service role permissions for the lessons table
-- This script helps diagnose and resolve permission issues with the service role

-- 1. Check current permissions on the lessons table
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'lessons' AND table_schema = 'public';

-- 2. Check if RLS is enabled on the table
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'lessons';

-- 3. Check if RLS is enforced for the service role
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'lessons';

-- 4. If needed, disable RLS enforcement for the service role
-- This allows the service role to bypass RLS policies
ALTER TABLE public.lessons FORCE ROW LEVEL SECURITY;
-- The correct syntax is to use ALTER POLICY to exempt the service role
-- or to use the following to disable RLS enforcement for the service role
ALTER TABLE public.lessons NO FORCE ROW LEVEL SECURITY;

-- Alternative approach: Instead of trying to grant BYPASSRLS, 
-- we'll disable RLS for the lessons table completely if needed
-- Uncomment the line below if you want to disable RLS entirely
-- ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to access all rows
DROP POLICY IF EXISTS "Service role has full access" ON public.lessons;
CREATE POLICY "Service role has full access"
ON public.lessons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Alternative approach: Disable RLS for the lessons table completely
-- Only use this as a last resort if other approaches fail
-- ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;

-- 5. Ensure the service role has all necessary privileges
GRANT ALL PRIVILEGES ON TABLE public.lessons TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 6. Verify the service role has the correct permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'lessons' AND table_schema = 'public' AND grantee = 'service_role';
