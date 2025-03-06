# Issue: Enhance Lesson Creation and Management Process

## Description
The current lesson creation process needs improvements to handle authentication requirements, Stripe account validation for paid lessons, and provide lesson editing capabilities for owners.

## Current Behavior
- Users can create lessons without proper authentication checks
- No validation for Stripe account ID when creating paid lessons
- No distinction between lesson owners and regular users
- No edit functionality for lesson owners
- "Purchase" button appears for all users, including the lesson owner

## Expected Behavior
- Only authenticated users can create lessons
- Users creating paid lessons must have a valid `stripe_account_id`
- Free lessons can be created without a Stripe account
- Lesson owners should see an "Edit Lesson" button instead of "Purchase"
- Proper RLS rules should be enforced for all operations

## Technical Analysis

### Authentication Flow
1. Verify user authentication before allowing lesson creation
2. Check for `stripe_account_id` in user profile when creating paid lessons
3. Implement proper error handling and user feedback

### Ownership Identification
1. Store creator's user ID with each lesson
2. Add RLS policies to restrict editing to lesson owners
3. Implement UI logic to show different actions based on ownership

### UI Changes
1. Replace "Purchase" button with "Edit Lesson" for owners
2. Add edit functionality to lesson detail page
3. Improve form validation and error messaging

## Files to Update

1. **app/components/ui/lesson-card.tsx**
   - Add ownership check to conditionally render "Edit" vs "Purchase" button
   - Connect to authentication context to determine ownership

2. **app/components/ui/lesson-preview-dialog.tsx**
   - Update to show different actions based on ownership

3. **app/lessons/new/page.tsx**
   - Add authentication guard
   - Add Stripe account validation for paid lessons
   - Improve error handling and user feedback

4. **app/lessons/[id]/lesson-detail.tsx**
   - Add edit functionality for lesson owners
   - Implement ownership checks

5. **app/components/ui/lesson-form.tsx**
   - Update to support both creation and editing modes
   - Add validation for paid lessons

6. **app/services/database/lessonsService.ts**
   - Implement proper RLS-compatible queries
   - Add methods for checking ownership

7. **supabase/migrations** (if needed)
   - Update RLS policies to enforce ownership restrictions

## Testing Requirements
1. Test lesson creation as authenticated user with Stripe account
2. Test lesson creation as authenticated user without Stripe account
3. Test free lesson creation without Stripe account
4. Test paid lesson creation without Stripe account (should fail)
5. Test edit functionality as lesson owner
6. Test edit functionality as non-owner (should fail)
7. Verify "Edit Lesson" button appears only for owners

## Additional Context
This enhancement will improve the user experience by providing clear feedback about requirements and permissions while maintaining security through proper authentication and authorization checks.

The RLS rules should ensure that:
- Users can only edit their own lessons
- All users can view published lessons
- Only authenticated users with proper permissions can create lessons
- Stripe account validation happens before allowing paid lesson creation

## Labels
- enhancement
- security
- user experience
