# Critical Bugs in Lesson Creation Flow

## Issue ID: ISSUE-2025-03-04-001

## Description
Three critical issues have been identified in the lesson creation flow:

1. **Video Uploader Stuck in Initialization**: The Mux video uploader is permanently stuck in a "Preparing Upload..." state, preventing users from uploading videos for their lessons.

2. **Authentication Flow Broken**: Despite authentication checks in the page component, users receive an "Authentication Required" toast when attempting to create a lesson, with a 404 error in the console:
   ```
   http://localhost:3000/sign-in?redirect=%2Flessons%2Fnew&_rsc=11z1u 404 (Not Found)
   ```

3. **Blocking Video Processing**: The current implementation forces users to wait for video processing to complete before the lesson is created, which is a poor user experience. Additionally, paid lessons are missing required Stripe product and price IDs.

## Technical Analysis

### Issue 1: Video Uploader Initialization Failure
The uploader is stuck in the loading state showing "Preparing upload..." because:
- The `startUpload` function in `useVideoUpload` is never automatically called on component mount
- There's no error handling for the initial API call failure in the UI
- The API endpoint `/api/mux/upload` may be failing to respond correctly

### Issue 2: Authentication Flow Issues
The authentication issue has multiple components:
- Duplicate authentication checks (client-side with `useAuth()` and server-side with `supabase.auth.getSession()`)
- Problematic redirect URL construction causing a 404 error
- Inconsistent authentication state between initial page load and form submission

### Issue 3: Blocking Video Processing & Missing Stripe Integration
- The current implementation in `lessons/new/page.tsx` (lines 48-108) blocks lesson creation until video processing is complete
- For paid lessons, the code doesn't create the required Stripe product and price IDs (`stripe_product_id` and `stripe_price_id` fields)
- The lesson should be created in a "draft" or "processing" state while the video processes in the background

## Affected Files

1. `/app/lessons/new/page.tsx` - Contains blocking video processing logic and missing Stripe integration
2. `/app/components/ui/lesson-form.tsx` - Form component that triggers the submission
3. `/app/components/ui/video-uploader.tsx` - Stuck in initialization state
4. `/app/hooks/use-video-upload.ts` - Not properly initializing the upload process
5. `/app/hooks/use-auth-guard.ts` - Not being used correctly for authentication protection
6. `/app/api/mux/upload/route.ts` - API endpoint for initializing uploads
7. `/app/api/lessons/route.ts` - Likely missing Stripe product/price creation for paid lessons

## Steps to Reproduce

### Video Uploader Issue:
1. Log in to the application
2. Navigate to `/lessons/new`
3. Observe that the video uploader remains stuck in "Preparing Upload..." state

### Authentication Issue:
1. Log in to the application
2. Navigate to `/lessons/new`
3. Fill out the lesson form
4. Click the submit button
5. Observe "Authentication Required" toast appears
6. Note the 404 error in the console for the sign-in redirect

### Blocking Video Processing & Missing Stripe IDs:
1. Log in to the application
2. Navigate to `/lessons/new`
3. Upload a video (if uploader worked)
4. Fill out the form with a price > 0
5. Submit the form
6. Observe that the user is forced to wait for video processing
7. Check database - paid lessons are missing stripe_product_id and stripe_price_id

## Root Causes

### Video Uploader:
- No automatic initialization of the upload URL
- Missing error handling for initialization failures

### Authentication:
- Duplicate and inconsistent authentication checks
- Incorrect redirect URL construction

### Blocking Video Processing & Missing Stripe IDs:
- The `waitForAssetReady` function in `page.tsx` blocks the form submission
- Missing Stripe product/price creation for paid lessons
- No background processing implementation for videos

## Proposed Solutions

### For Video Uploader Issue:
1. Modify `VideoUploader` component to automatically call `handleUploadStart` during initialization
2. Add better error handling and retry logic

### For Authentication Issue:
1. Implement consistent authentication using the `useAuthGuard` hook
2. Fix redirect URL construction

### For Blocking Video Processing & Missing Stripe IDs:
1. Modify the lesson creation flow to create the lesson immediately without waiting for video processing
2. Create a background processing API endpoint for video processing
3. Add Stripe product/price creation for paid lessons

## Testing Requirements

New tests should be created to verify fixes for all issues:

1. **Video Uploader Tests**:
   - Test automatic initialization
   - Test error handling and retry logic
   - Test upload progress and completion

2. **Authentication Tests**:
   - Test page access protection
   - Test form submission with authentication
   - Test redirect URL construction

3. **Background Processing Tests**:
   - Test lesson creation without waiting for video
   - Test Stripe product/price creation for paid lessons
   - Test background video processing

## Additional Context

These issues are blocking the core functionality of creating new lessons. The current implementation has several design flaws that create a poor user experience. The proposed solutions will significantly improve the user experience by allowing users to create lessons quickly without waiting for video processing to complete.

## Priority
High

## Labels
- bug
- high-priority
- authentication
- video-upload
- stripe-integration
- ux

## Assigned To
Unassigned

## Created
2025-03-04

## Due Date
2025-03-11
