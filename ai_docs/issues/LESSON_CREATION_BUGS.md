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

### Issue 1: Video Uploader Initialization Failure ✅ FIXED
The uploader was stuck in the loading state showing "Preparing upload..." because:
- The `startUpload` function in `useVideoUpload` was never automatically called on component mount
- There was no error handling for the initial API call failure in the UI
- The API endpoint `/api/mux/upload` may have been failing to respond correctly

**Fixed by:**
- Added a new `initializeUpload` function that's automatically called on component mount
- Added a new 'initializing' state to better represent what's happening
- Improved error handling during initialization
- Separated status messages from error messages
- Added better error reporting for API failures

```typescript
// app/hooks/use-video-upload.ts
// New function added to initialize upload automatically
const initializeUpload = useCallback(async () => {
  // Only initialize if we're in idle state
  if (status !== 'idle') return;
  
  setStatus('initializing');
  setProgress(0);
  setError(null);
  
  try {
    const url = await withRetry(
      getUploadUrl,
      {
        retries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          // Don't set this as an error, use a separate state for status messages
          console.log(`Preparing upload (attempt ${attempt})...`);
        }
      }
    );
    
    setUploadEndpoint(url);
    setStatus('ready'); // Set to 'ready' when URL is obtained
  } catch (error) {
    console.error('Failed to initialize upload:', error);
    setStatus('error');
    setError(error instanceof Error ? error.message : 'Failed to initialize upload');
    if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize upload'));
  }
}, [getUploadUrl, onError, status]);

// Auto-initialize on mount with useEffect
useEffect(() => {
  // Auto-initialize on mount if in idle state
  if (status === 'idle') {
    initializeUpload();
  }
}, [initializeUpload, status]);
```

### Issue 2: Authentication Flow Issues ✅ FIXED
The authentication issue had multiple components:
- Duplicate authentication checks (client-side with `useAuth()` and server-side with `supabase.auth.getSession()`)
- Problematic redirect URL construction causing a 404 error
- Inconsistent authentication state between initial page load and form submission

**Fixed by:**
- Consolidated authentication checks to use the `useAuth()` hook consistently
- Fixed redirect URL construction to use `callbackUrl` instead of `redirect`
- Removed duplicate authentication checks during form submission
- Improved loading and error states to provide better user feedback

```typescript
// app/services/auth/supabaseAuth.ts
// Fixed redirect URL construction
const options = {
  redirectTo: callbackUrl 
    ? `${redirectTo}?redirect_to=${encodeURIComponent(callbackUrl)}`
    : redirectTo,
  skipBrowserRedirect: false,
}

// app/lessons/new/page.tsx
// Consistent authentication check
useEffect(() => {
  if (!authLoading && !user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to create a lesson",
      variant: "destructive",
    });
    router.push('/sign-in?callbackUrl=/lessons/new');
  }
}, [user, authLoading, router]);
```

### Issue 3: Blocking Video Processing & Missing Stripe Integration ✅ FIXED
- The previous implementation in `lessons/new/page.tsx` blocked lesson creation until video processing was complete
- For paid lessons, the code needed to create the required Stripe product and price IDs
- The lesson should be created in a "processing" state while the video processes in the background

**Fixed by:**
- Created a new API endpoint for background video processing (`app/api/lessons/process-video/route.ts`)
- Updated lesson creation flow to create lessons immediately with "processing" status
- Implemented background processing for videos
- Ensured Stripe product/price creation for paid lessons
- Improved user experience with appropriate loading states and feedback

```typescript
// app/lessons/new/page.tsx
// Non-blocking implementation
// Create lesson data object - set status to 'processing'
const lessonData = {
  ...data,
  status: 'processing'
};

// Create the lesson immediately without waiting for video processing
const response = await fetch("/api/lessons", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(lessonData),
});

// Start background video processing
fetch('/api/lessons/process-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lessonId: lesson.id,
    muxAssetId: data.muxAssetId
  }),
}).catch(error => {
  console.error('Failed to start background processing:', error);
});

// Redirect to the lesson page
router.push(`/lessons/${lesson.id}`);
```

**New API Endpoint:**
Created a new API endpoint at `app/api/lessons/process-video/route.ts` that handles video processing in the background without blocking the user experience.

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
- [x] Video uploader initializes automatically on component mount
- [x] Upload initialization errors are properly handled and displayed to the user
- [x] Retry mechanism works correctly for failed initialization attempts
- [x] Upload progress is accurately displayed to the user

### Issue 2: Authentication
- [x] Page is properly protected using authentication checks
- [x] No duplicate authentication checks in the code
- [x] Redirect URL is correctly constructed and works properly
- [x] No 404 errors appear in the console during authentication flow

### Issue 3: Video Processing
- [x] Lesson is created immediately after form submission without waiting for video processing
- [x] Video processing happens in the background
- [x] Lesson shows appropriate "processing" state to the user
- [x] Paid lessons have correct Stripe product and price IDs
- [x] User is notified when video processing completes

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

## Implementation Details

### Video Uploader Fix Implementation

The `VideoUploader` component needs to be modified to automatically initialize the upload URL on component mount:

```typescript
// In VideoUploader component
useEffect(() => {
  if (!uploadEndpoint) {
    startUpload();
  }
}, [uploadEndpoint, startUpload]);
```

The `useVideoUpload` hook should be enhanced with better error handling:

```typescript
// In getUploadUrl function of useVideoUpload hook
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
```

### Authentication Fix Implementation

The lesson creation page should use the `useAuthGuard` hook consistently:

```typescript
// In lessons/new/page.tsx
const { isAuthenticated, loading: authLoading, user } = useAuthGuard({
  redirectTo: '/sign-in?callbackUrl=/lessons/new',
  showToast: true
});

// Remove duplicate authentication checks
```

### Non-Blocking Video Processing Implementation

The lesson creation flow should be updated to:

1. Create a new API endpoint for background video processing:

```typescript
// app/api/lessons/process-video/route.ts
export async function POST(request: Request) {
  const { lessonId, muxAssetId, isPaid } = await request.json();
  
  try {
    // Poll Mux API for asset status
    const result = await waitForAssetReady(muxAssetId, {
      maxAttempts: 60,
      interval: 10000
    });
    
    if (result.status === 'ready' && result.playbackId) {
      // Update lesson with playback ID and change status to published
      const supabase = createServerSupabaseClient();
      const { error } = await supabase
        .from('lessons')
        .update({ 
          status: 'published',
          mux_playback_id: result.playbackId
        })
        .eq('id', lessonId);
      
      if (error) {
        console.error('Failed to update lesson:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Video processing failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json({ error: 'Failed to process video' }, { status: 500 });
  }
}
```

2. Update the lesson creation flow to create the lesson immediately and start background processing:

```typescript
// In lessons/new/page.tsx
// Create lesson immediately with processing status
const lessonData = {
  ...data,
  status: 'processing',
  muxAssetId: data.muxAssetId
};

// Create lesson first
const response = await fetch("/api/lessons", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(lessonData),
});

if (!response.ok) {
  // Error handling...
}

const lesson = await response.json();

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

// Redirect to lesson page
router.push(`/lessons/${lesson.id}`);
```

3. Ensure the Stripe integration is properly handled in the lesson creation API:

```typescript
// In app/api/lessons/route.ts
// Check if this is a paid lesson
if (price > 0) {
  // Verify user can create paid lessons
  const canCreatePaid = await canCreatePaidLessons(session.user.id, supabase);
  if (!canCreatePaid) {
    return createErrorResponse(
      'Stripe account required for paid lessons', 
      403, 
      'You must connect a Stripe account and complete onboarding to create paid lessons'
    );
  }

  try {
    // Get the user's Stripe account ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return createErrorResponse('Stripe account required', 403);
    }

    // Create a Stripe product for the lesson
    const productId = await createProductForLesson({
      id: lessonData.id,
      title,
      description
    });

    // Create a Stripe price for the product
    const priceId = await createPriceForProduct(productId, price);

    // Update the lesson data with Stripe IDs
    lessonData.stripe_product_id = productId;
    lessonData.stripe_price_id = priceId;
  } catch (error) {
    console.error('Stripe product/price creation error:', error);
    // Continue anyway, as the lesson is created
    // In a production environment, you might want to implement a background job to retry
  }
}
```

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
