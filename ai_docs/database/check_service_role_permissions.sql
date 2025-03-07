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

-- Check if the service_role exists before granting BYPASSRLS
DO $$
BEGIN
    -- Check if the role exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        -- Grant BYPASSRLS to the service_role
        EXECUTE 'GRANT BYPASSRLS TO service_role';
    ELSE
        RAISE NOTICE 'Role "service_role" does not exist. Skipping BYPASSRLS grant.';
    END IF;
END
$$;

-- 5. Ensure the service role has all necessary privileges
GRANT ALL PRIVILEGES ON TABLE public.lessons TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 6. Verify the service role has the correct permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'lessons' AND table_schema = 'public' AND grantee = 'service_role';
