# Issue: Profile Form Not Loading Data from Supabase Profiles Table

## Description
The profile form is failing to load user profile data from the Supabase 'profiles' table. While the "Name" field is populated (likely from user metadata), the "Bio" and "Social Media" fields remain empty. The console logs show `{data: null, error: null}` when querying the profiles table, indicating the profile record doesn't exist or can't be accessed.

## Steps to Reproduce
1. Log in to the application
2. Navigate to the profile page
3. Observe that only the Name field is populated, while Bio and Social Media fields remain empty
4. Check console logs showing: "Raw profile data response: {data: null, error: null}" followed by "No profile data found, using user metadata as fallback"

## Technical Analysis
After reviewing the code, I've identified several potential issues:

1. **Inconsistent Profile Creation**: 
   - In `AuthContext.tsx`, there's a `createOrUpdateProfile` function that should create a profile when a user signs in
   - However, this function is only called on the 'SIGNED_IN' event, not during initial auth state check
   - The database also has a trigger (`handle_new_user`) that should create profiles automatically

2. **Row Level Security (RLS) Issues**:
   - The Supabase migrations show RLS is enabled on the profiles table
   - The policies only allow users to select/insert/update their own profiles
   - The client-side Supabase instance might not have the proper authentication context

3. **Database Schema Mismatch**:
   - The form expects fields like `bio` and `social_media_tag`
   - The migration files show these fields exist, but there might be a mismatch

4. **Trigger Function Issues**:
   - The `handle_new_user` trigger function creates profiles with limited fields (id, full_name, email, avatar_url)
   - It doesn't initialize `bio` and `social_media_tag` fields

## Root Cause
The most likely root cause is that:

1. The profile record is either not being created properly when a user signs up, or
2. The RLS policies are preventing the client from accessing the profile data, or
3. The profile exists but with null values for bio and social_media_tag

## Proposed Solution

1. **Fix Profile Creation**:
   - Update the `AuthContext.tsx` to ensure profile creation happens during initial auth check
   - Modify the `createOrUpdateProfile` function to include all required fields

2. **Update Profile Form Fetching Logic**:
   - Modify the `fetchProfileData` function to handle the case where no profile exists
   - Always use server-side authentication for profile operations

3. **Check Database Trigger**:
   - Update the `handle_new_user` trigger function to initialize all profile fields

## Files Affected
- `app/profile/components/profile-form.tsx` - Main file with the issue
- `app/services/auth/AuthContext.tsx` - Profile creation logic
- `supabase/migrations/20250304010000_add_user_profile_trigger.sql` - Database trigger for profile creation
- `app/api/profile/update/route.ts` - Server-side profile update handler

## Testing Requirements
1. Test with new users who don't have a profile record yet
2. Test with existing users who have profile data
3. Verify all form fields (Name, Bio, Social Media) are correctly populated from Supabase
4. Verify updates to the profile are correctly saved to Supabase

## Additional Context
The issue appears to be a combination of:
1. Incomplete profile creation during user signup
2. Lack of proper error handling when profile data is missing
3. Inconsistent initialization of profile fields

The solution should ensure that:
1. Profiles are always created with all required fields
2. The form handles the case where a profile doesn't exist yet
3. The form always uses Supabase as the source of truth for profile data
4. All authentication is handled through the server for consistency
