# Critical Bugs in Lesson Creation Flow

## Issue ID: ISSUE-2025-03-04-001

## Description
Three critical issues have been identified in the lesson creation flow, prioritized by user impact:

1. **[PRIORITY 1] Video Uploader Stuck in Initialization**: The Mux video uploader is permanently stuck in a "Preparing Upload..." state, preventing users from uploading videos for their lessons.

2. **[PRIORITY 2] Authentication Flow Broken**: Despite authentication checks in the page component, users receive an "Authentication Required" toast when attempting to create a lesson, with a 404 error in the console:
   ```
   http://localhost:3000/sign-in?redirect=%2Flessons%2Fnew&_rsc=11z1u 404 (Not Found)
   ```

3. **[PRIORITY 3] Blocking Video Processing**: The current implementation forces users to wait for video processing to complete before the lesson is created, which is a poor user experience. Additionally, paid lessons are missing required Stripe product and price IDs.

## Technical Analysis

### Issue 1: Video Uploader Initialization Failure
The uploader is stuck in the loading state showing "Preparing upload..." because:
- The `startUpload` function in `useVideoUpload` is never automatically called on component mount
- There's no error handling for the initial API call failure in the UI
- The API endpoint `/api/mux/upload` may be failing to respond correctly

**Problematic Code:**
```typescript
// app/hooks/use-video-upload.ts
const handleUploadStart = useCallback(() => {
  setStatus('uploading');
  setProgress(0);
  setError(null);
  
  withRetry(
    getUploadUrl,
    {
      retries: 3,
      initialDelay: 1000,
      onRetry: (attempt) => {
        setError(`Preparing upload (attempt ${attempt})...`);
      }
    }
  )
    .then((url) => {
      setUploadEndpoint(url);
      setError(null);
    })
    .catch(handleError);
}, [getUploadUrl, handleError]);

// This function is never automatically called on component mount
```

### Issue 2: Authentication Flow Issues
The authentication issue has multiple components:
- Duplicate authentication checks (client-side with `useAuth()` and server-side with `supabase.auth.getSession()`)
- Problematic redirect URL construction causing a 404 error
- Inconsistent authentication state between initial page load and form submission

**Problematic Code:**
```typescript
// app/lessons/new/page.tsx
// Client-side check
useEffect(() => {
  if (!authLoading && !user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to create a lesson",
      variant: "destructive",
    });
    router.push('/sign-in?redirect=/lessons/new');
  }
}, [user, authLoading, router]);

// Later, another server-side check
const session = await supabase.auth.getSession();
if (!session.data.session) {
  toast({
    title: "Authentication Required",
    description: "Please sign in to create a lesson",
    variant: "destructive",
  });
  setIsSubmitting(false);
  router.push('/sign-in?redirect=/lessons/new');
  return;
}
```

### Issue 3: Blocking Video Processing & Missing Stripe Integration
- The current implementation in `lessons/new/page.tsx` (lines 48-108) blocks lesson creation until video processing is complete
- For paid lessons, the code doesn't create the required Stripe product and price IDs (`stripe_product_id` and `stripe_price_id` fields)
- The lesson should be created in a "draft" or "processing" state while the video processes in the background

**Problematic Code:**
```typescript
// app/lessons/new/page.tsx
// Blocking wait for video processing
try {
  console.log('Starting video processing for asset:', data.muxAssetId);
  
  // Wait for asset to be ready and get playback ID
  result = await waitForAssetReady(data.muxAssetId, {
    isFree: data.price === 0,
    maxAttempts: 60,  // 10 minutes total
    interval: 10000   // 10 seconds between checks
  });
  
  console.log('Video processing completed:', result);
  
  if (result.status !== 'ready' || !result.playbackId) {
    throw new Error('Video processing completed but no playback ID was generated');
  }

  // Dismiss the processing toast
  processingToast.dismiss();
  
  // Show success toast
  toast({
    title: "Video Processing Complete",
    description: "Your video has been processed successfully.",
  });
} catch (error) {
  // Error handling...
}
```

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
1. Modify `VideoUploader` component to automatically call `handleUploadStart` during initialization:
```typescript
// In VideoUploader component
useEffect(() => {
  // Initialize upload URL on component mount
  startUpload();
}, []);
```

2. Add better error handling and retry logic:
```typescript
// In useVideoUpload hook
const getUploadUrl = useCallback(async (): Promise<string> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(`Failed to get upload URL (HTTP ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.url || !data.uploadId) {
      throw new Error('Invalid upload response: missing URL or upload ID');
    }
    
    return data.url;
  } catch (error) {
    console.error('Upload URL error:', error);
    throw error; // Let the retry mechanism handle it
  }
}, [endpoint]);
```

### For Authentication Issue:
1. Implement consistent authentication using the `useAuthGuard` hook:
```typescript
// In lessons/new/page.tsx
const { isAuthenticated, loading: authLoading, user } = useAuthGuard({
  redirectTo: '/sign-in?callbackUrl=/lessons/new',
  showToast: true
});

// Remove duplicate authentication checks
```

2. Fix redirect URL construction:
```typescript
// Use callbackUrl instead of redirect for Next.js compatibility
router.push('/sign-in?callbackUrl=/lessons/new');
```

### For Blocking Video Processing & Missing Stripe IDs:
1. Create lesson in "processing" state without waiting for video:
```typescript
// Create lesson immediately with processing status
const lessonData = {
  ...data,
  status: 'processing',
  muxAssetId: data.muxAssetId,
  // Other fields...
};

// Create lesson first
const lesson = await createLesson(lessonData);

// Then start background processing
fetch('/api/lessons/process-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    lessonId: lesson.id,
    muxAssetId: data.muxAssetId,
    isPaid: data.price > 0
  })
});
```

2. Add Stripe product/price creation for paid lessons:
```typescript
// In API route for lesson creation
if (data.price > 0) {
  // Create Stripe product
  const product = await stripe.products.create({
    name: data.title,
    description: data.description
  });
  
  // Create Stripe price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(data.price * 100),
    currency: 'usd'
  });
  
  // Add IDs to lesson data
  lessonData.stripe_product_id = product.id;
  lessonData.stripe_price_id = price.id;
}
```

## Architectural Diagram: Current vs. Proposed Video Processing Flow

```
CURRENT FLOW:
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Upload    │────>│  Process   │────>│  Create    │────>│  Redirect  │
│  Video     │     │  Video     │     │  Lesson    │     │  to Lesson │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                   (Blocking)

PROPOSED FLOW:
┌────────────┐     ┌────────────┐     ┌─────────────────────┐
│  Upload    │────>│  Create    │────>│  Redirect to Lesson │
│  Video     │     │  Lesson    │     │  (Processing State) │
└────────────┘     └────────────┘     └─────────────────────┘
                         │
                         │                  ┌────────────┐
                         └─────────────────>│  Process   │
                                            │  Video     │
                                            └────────────┘
                                           (Background Task)
```

## Acceptance Criteria

### Issue 1: Video Uploader
- [ ] Video uploader initializes automatically on component mount
- [ ] Upload initialization errors are properly handled and displayed to the user
- [ ] Retry mechanism works correctly for failed initialization attempts
- [ ] Upload progress is accurately displayed to the user

### Issue 2: Authentication
- [ ] Page is properly protected using the `useAuthGuard` hook
- [ ] No duplicate authentication checks in the code
- [ ] Redirect URL is correctly constructed and works properly
- [ ] No 404 errors appear in the console during authentication flow

### Issue 3: Video Processing
- [ ] Lesson is created immediately after form submission without waiting for video processing
- [ ] Video processing happens in the background
- [ ] Lesson shows appropriate "processing" state to the user
- [ ] Paid lessons have correct Stripe product and price IDs
- [ ] User is notified when video processing completes

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
High - Fix in order of priority listed above

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
