# Issue: Implement Row Level Security (RLS) in Supabase

## Description

Currently, our Supabase tables have Row Level Security (RLS) turned off, which poses security risks as it allows unrestricted access to data. We need to implement proper RLS policies across all tables to ensure data is only accessible to authorized users according to business rules.

## Technical Analysis

### Current State
- All Supabase tables have RLS disabled
- API routes handle authorization manually
- No consistent enforcement of data access rules at the database level

### Required Changes
1. Enable RLS on all tables
2. Create appropriate policies for each table
3. Update API routes to work with RLS
4. Update client-side queries to work with authenticated sessions
5. Update tests to account for RLS behavior

## Implementation Plan

### 1. Enable RLS on Tables
Enable RLS on all tables through the Supabase dashboard or via SQL:

```sql
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- Add any other tables
```

### 2. Create RLS Policies

#### Lessons Table
```sql
-- Anyone can view published lessons
CREATE POLICY "Anyone can view published lessons" 
ON lessons FOR SELECT 
USING (status = 'published');

-- Creators can manage their own lessons
CREATE POLICY "Creators can manage their own lessons" 
ON lessons FOR ALL 
USING (auth.uid() = creator_id);

-- Allow insert with creator_id set to current user
CREATE POLICY "Users can create lessons as themselves" 
ON lessons FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- Allow update only if user owns the lesson
CREATE POLICY "Users can update their own lessons" 
ON lessons FOR UPDATE 
USING (auth.uid() = creator_id);

-- Allow delete only if user owns the lesson
CREATE POLICY "Users can delete their own lessons" 
ON lessons FOR DELETE 
USING (auth.uid() = creator_id);
```

#### Categories Table
```sql
-- Anyone can view categories
CREATE POLICY "Anyone can view categories" 
ON categories FOR SELECT 
USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can modify categories" 
ON categories FOR INSERT UPDATE DELETE
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));
```

#### Lesson Requests Table
```sql
-- Anyone can view lesson requests
CREATE POLICY "Anyone can view lesson requests" 
ON lesson_requests FOR SELECT 
USING (true);

-- Users can create requests
CREATE POLICY "Users can create requests" 
ON lesson_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Users can update their own requests" 
ON lesson_requests FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own requests
CREATE POLICY "Users can delete their own requests" 
ON lesson_requests FOR DELETE 
USING (auth.uid() = user_id);
```

#### Purchases Table
```sql
-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" 
ON purchases FOR SELECT 
USING (auth.uid() = user_id);

-- Creators can view purchases of their lessons
CREATE POLICY "Creators can view purchases of their lessons" 
ON purchases FOR SELECT 
USING (lesson_id IN (SELECT id FROM lessons WHERE creator_id = auth.uid()));

-- System can insert purchases (for checkout process)
CREATE POLICY "System can insert purchases" 
ON purchases FOR INSERT 
WITH CHECK (true);  -- Consider restricting this further
```

### 3. Update API Routes
Update API routes to use authenticated Supabase clients:

1. Use `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs` in all API routes
2. Ensure user sessions are properly passed to Supabase
3. Remove redundant authorization checks that are now handled by RLS

### 4. Update Client-Side Queries
Ensure client-side queries use authenticated Supabase clients:

1. Use `createClientComponentClient` from `@supabase/auth-helpers-nextjs`
2. Ensure components properly handle data filtered by RLS

### 5. Update Tests
Update tests to account for RLS behavior:

1. Modify mock Supabase client to simulate RLS filtering
2. Ensure E2E tests authenticate before accessing protected resources
3. Add tests specifically for RLS policy enforcement

### 6. Create Migration Script
Create a migration script to enable RLS and add all policies:

```sql
-- migrations/enable_rls.sql
BEGIN;

-- Enable RLS on all tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- Add other tables as needed

-- Add all policies as defined above

COMMIT;
```

### 7. Documentation
Create documentation explaining the RLS policies implemented:

1. Document each table's policies
2. Explain security considerations
3. Provide guidelines for developers working with RLS

## Acceptance Criteria

- [ ] RLS is enabled on all tables in Supabase
- [ ] Appropriate policies are created for each table
- [ ] API routes work correctly with RLS enabled
- [ ] Client-side queries respect RLS policies
- [ ] Tests pass with RLS enabled
- [ ] Migration script is created and tested
- [ ] Documentation is created for RLS policies

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## Estimated Effort
- Medium-Large (3-5 days)

## Priority
- High (Security Issue)

## Labels
- security
- database
- enhancement
