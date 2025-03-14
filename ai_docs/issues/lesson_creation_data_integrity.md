# Issue Report: Critical Data Integrity Issues in Lesson Creation Flow

## Issue Description

Our lesson creation process has several critical data integrity issues that need immediate attention:

1. **Incorrect Mux Asset ID Storage**: The system is storing placeholder values like temp_1741882991344 for `mux_asset_id` in the database instead of waiting for the actual asset ID from Mux.

2. **Missing Stripe Product/Price Creation**: When creating paid lessons, the system fails to create Stripe products and prices, resulting in missing `stripe_product_id` and `stripe_price_id` values.

3. **Insufficient Stripe Account Verification**: The UI attempts to validate Stripe account status, but the server-side validation is incomplete, allowing users without verified Stripe accounts to create paid lessons.

4. **Inconsistent Video Processing Status**: The video processing status is not properly tracked or updated throughout the lesson creation flow.

These issues compromise data integrity, break the payment flow, and could lead to video playback failures for users.

## Technical Analysis

### 1. Mux Asset ID Issue

In `app/api/lessons/update-video/route.ts`, line 25-30:
```typescript
// Update the lesson with the asset ID
const { data, error } = await supabase
  .from('lessons')
  .update({
    mux_asset_id: muxAssetId || 'placeholder',  // <-- PROBLEM: Using 'placeholder' as fallback
    updated_at: new Date().toISOString()
  })
```

This code allows setting a placeholder value instead of requiring a valid Mux asset ID. The webhook handler in `app/api/webhooks/mux/route.ts` attempts to update this later, but there's no guarantee this will happen if there are issues with the webhook delivery.

In `app/hooks/use-video-upload.ts`, the upload flow attempts to get the asset ID but doesn't properly handle the case where processing is still ongoing:

```typescript
// Get the asset ID from the upload
const response = await fetch(`/api/mux/asset-from-upload?uploadId=${encodeURIComponent(uploadId)}`...
```

If the asset isn't ready, the code continues with form submission using temporary values.

### 2. Stripe Product/Price Issue

In `app/api/lessons/route.ts`, the lesson creation endpoint doesn't create Stripe products or prices for paid lessons:

```typescript
// Create lesson in database
const { data: lesson, error } = await supabase
  .from('lessons')
  .insert({
    title: lessonData.title,
    description: lessonData.description,
    content: lessonData.content || '',
    price: lessonData.price || 0,
    creator_id: userId,
    mux_asset_id: lessonData.muxAssetId,
    mux_playback_id: lessonData.muxPlaybackId,
    video_processing_status: 'processing',
    status: 'draft',
  } as TablesInsert<'lessons'>)
  .select()
  .single();
```

There's no code to create Stripe products/prices or store their IDs in the database.

### 3. Stripe Account Verification Issue

In `app/components/ui/lesson-form.tsx`, there's client-side validation for Stripe accounts:

```typescript
// Validate paid lessons require a Stripe account
if (data.price > 0) {
  if (!hasStripeAccount) {
    toast({
      title: "Stripe Account Required",
      description: "You need to connect a Stripe account to create paid lessons",
      variant: "destructive",
    });
    return;
  }
  
  if (stripeAccountStatus && !stripeAccountStatus.onboardingComplete) {
    toast({
      title: "Stripe Onboarding Incomplete",
      description: "Please complete your Stripe onboarding before creating paid lessons",
      variant: "destructive",
    });
    return;
  }
}
```

However, in `app/services/database/lessonsService.ts`, the server-side validation only checks if a Stripe account exists, not if it's fully verified:

```typescript
// For paid lessons, check if user has a Stripe account
if (data.price > 0) {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', session.user.id)
    .single();
  
  if (profileError) {
    return {
      data: null,
      error: {
        message: `Failed to verify profile: ${profileError.message}`,
        details: profileError.message,
        hint: 'Check user profile',
        code: 'PROFILE_ERROR'
      } as PostgrestError
    };
  }
  
  if (!profileData.stripe_account_id) {
    return {
      data: null,
      error: {
        message: 'Stripe account required for paid lessons',
        details: 'Missing Stripe account',
        hint: 'Connect a Stripe account first',
        code: 'STRIPE_REQUIRED'
      } as PostgrestError
    };
  }
}
```

This only checks for the existence of `stripe_account_id`, not whether the account is verified or onboarding is complete.

### 4. Video Processing Status Issue

The video processing status is inconsistently tracked. In `app/api/lessons/route.ts`, it's set to 'processing':

```typescript
video_processing_status: 'processing',
```

But there's no comprehensive flow to update this status as processing progresses.

## Reproduction Steps

1. Create a new user account
2. Navigate to `/lessons/new`
3. Fill out the lesson form with a price > 0
4. Upload a video
5. Submit the form
6. Check the database:
   - The `mux_asset_id` will contain "placeholder" instead of a real Mux asset ID
   - The `stripe_product_id` and `stripe_price_id` will be null
   - The lesson will be created even if the Stripe account is not fully verified

## Expected Behavior

1. **For Video Processing**:
   - The system should either wait for Mux processing to complete before finalizing lesson creation, or
   - Create the lesson with a "processing" status and reliably update it via webhook when processing completes
   - The `mux_asset_id` should only be set with an actual value from Mux, never a placeholder
   - The `video_processing_status` should accurately reflect the current state

2. **For Paid Lessons**:
   - The system should verify the creator has a fully verified Stripe account with charges enabled
   - It should create a Stripe product and price during lesson creation
   - It should store the correct `stripe_product_id` and `stripe_price_id` in the database
   - If any step fails, the lesson creation should fail with appropriate error messages

## Affected Files

1. `app/components/ui/lesson-form.tsx` - Client-side form handling and validation
2. `app/hooks/use-video-upload.ts` - Video upload handling
3. `app/api/lessons/route.ts` - Lesson creation endpoint
4. `app/services/database/lessonsService.ts` - Database operations for lessons
5. `app/services/mux.ts` - Mux integration
6. `app/services/stripe.ts` - Stripe integration
7. `app/api/lessons/update-video/route.ts` - Video update endpoint
8. `app/api/mux/asset-from-upload/route.ts` - Mux asset creation
9. `app/api/webhooks/mux/route.ts` - Mux webhook handling
10. `app/components/ui/stripe-account-status.tsx` - Stripe account status display

## Proposed Solution

### 1. Fix Mux Asset ID Storage

#### Option A: Wait for Processing to Complete
```typescript
// In app/hooks/use-video-upload.ts
const handleUploadSuccess = useCallback(async (uploadId: string) => {
  try {
    setStatus('processing');
    setProgress(80);
    
    // Wait for the asset to be ready before completing
    const assetResponse = await fetch(`/api/mux/wait-for-asset?uploadId=${encodeURIComponent(uploadId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!assetResponse.ok) {
      throw new Error(`Failed to get asset: ${assetResponse.status}`);
    }
    
    const assetData = await assetResponse.json();
    
    if (!assetData.assetId || !assetData.playbackId) {
      throw new Error('No asset ID or playback ID returned');
    }
    
    // Set status to complete
    setStatus('complete');
    setProgress(100);
    if (onProgress) onProgress(100);
    
    // Call onUploadComplete with the assetId and playbackId
    if (onUploadComplete) {
      onUploadComplete(assetData.assetId, assetData.playbackId);
    }
  } catch (error) {
    // Error handling
  }
}, [onError, onProgress, onUploadComplete, lessonId]);
```

#### Option B: Improve Webhook Reliability
```typescript
// In app/api/lessons/route.ts
// Create lesson with processing status
const { data: lesson, error } = await supabase
  .from('lessons')
  .insert({
    // ...other fields
    mux_upload_id: lessonData.uploadId, // Store upload ID instead of asset ID
    video_processing_status: 'processing',
    status: 'draft',
  })
  .select()
  .single();

// In app/api/webhooks/mux/route.ts
// Improve webhook handling with retries and better error handling
if (type === 'video.asset.ready') {
  const assetId = body.data.id;
  const playbackId = body.data.playback_ids?.[0]?.id;
  
  if (!playbackId) {
    console.error('No playback ID found in asset.ready event');
    return NextResponse.json({ error: 'No playback ID found' }, { status: 400 });
  }
  
  // Implement retry logic for database updates
  let retries = 3;
  let updateSuccess = false;
  
  while (retries > 0 && !updateSuccess) {
    try {
      const updateResult = await supabaseClient
        .from('lessons')
        .update({ 
          mux_asset_id: assetId,
          mux_playback_id: playbackId,
          video_processing_status: 'ready',
          status: 'published'
        })
        .eq('mux_asset_id', assetId);
      
      updateSuccess = !updateResult.error;
      
      if (!updateSuccess) {
        console.error(`Update attempt failed (${retries} retries left):`, updateResult.error);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Exception during update (${retries} retries left):`, error);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### 2. Fix Stripe Product/Price Creation

```typescript
// In app/services/database/lessonsService.ts
async createLesson(data: LessonCreateData): Promise<DatabaseResponse<Lesson>> {
  return this.executeWithRetry(async () => {
    // ...existing code
    
    // For paid lessons, create Stripe product and price
    let stripeProductId = null;
    let stripePriceId = null;
    
    if (data.price > 0) {
      try {
        // Import stripe service
        const { createProductForLesson, createPriceForProduct } = await import('@/app/services/stripe');
        
        // Create product
        stripeProductId = await createProductForLesson({
          id: lessonId,
          title: data.title,
          description: data.description
        });
        
        // Create price
        stripePriceId = await createPriceForProduct(
          stripeProductId,
          data.price
        );
      } catch (stripeError) {
        return {
          data: null,
          error: {
            message: `Failed to create Stripe product/price: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}`,
            details: 'Stripe product creation failed',
            hint: 'Check Stripe configuration',
            code: 'STRIPE_PRODUCT_ERROR'
          } as PostgrestError
        };
      }
    }
    
    // Insert lesson with Stripe product/price IDs
    const { data: insertData, error } = await supabase
      .from('lessons')
      .insert({
        // ...existing fields
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      })
      .select()
      .single();
    
    // ...rest of the function
  });
}
```

### 3. Enforce Stripe Account Verification

```typescript
// In app/services/database/lessonsService.ts
async createLesson(data: LessonCreateData): Promise<DatabaseResponse<Lesson>> {
  return this.executeWithRetry(async () => {
    // ...existing code
    
    // For paid lessons, check if user has a verified Stripe account
    if (data.price > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_account_status, stripe_onboarding_complete')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        return {
          data: null,
          error: {
            message: `Failed to verify profile: ${profileError.message}`,
            details: profileError.message,
            hint: 'Check user profile',
            code: 'PROFILE_ERROR'
          } as PostgrestError
        };
      }
      
      if (!profileData.stripe_account_id) {
        return {
          data: null,
          error: {
            message: 'Stripe account required for paid lessons',
            details: 'Missing Stripe account',
            hint: 'Connect a Stripe account first',
            code: 'STRIPE_REQUIRED'
          } as PostgrestError
        };
      }
      
      // Check if Stripe onboarding is complete
      const isOnboardingComplete = 
        profileData.stripe_onboarding_complete === true || 
        profileData.stripe_account_status === 'complete';
      
      if (!isOnboardingComplete) {
        // Verify with Stripe directly
        try {
          const { verifyStripeAccountById } = await import('@/app/services/stripe');
          const status = await verifyStripeAccountById(profileData.stripe_account_id);
          
          if (!status.isComplete) {
            return {
              data: null,
              error: {
                message: 'Stripe onboarding incomplete',
                details: 'Your Stripe account setup is not complete',
                hint: 'Please complete Stripe onboarding before creating paid lessons',
                code: 'STRIPE_ONBOARDING_INCOMPLETE'
              } as PostgrestError
            };
          }
        } catch (stripeError) {
          return {
            data: null,
            error: {
              message: `Failed to verify Stripe account: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}`,
              details: 'Stripe verification failed',
              hint: 'Check Stripe account status',
              code: 'STRIPE_VERIFICATION_ERROR'
            } as PostgrestError
          };
        }
      }
    }
    
    // ...rest of the function
  });
}
```

### 4. Improve Video Processing Status Tracking

```typescript
// In app/api/lessons/route.ts
// Set initial status based on whether we have a video
const videoProcessingStatus = lessonData.muxAssetId ? 'processing' : 'none';
const initialStatus = videoProcessingStatus === 'none' ? 'published' : 'draft';

const { data: lesson, error } = await supabase
  .from('lessons')
  .insert({
    // ...other fields
    video_processing_status: videoProcessingStatus,
    status: initialStatus,
  })
  .select()
  .single();

// In app/api/webhooks/mux/route.ts
// Update status when video is ready
if (type === 'video.asset.ready') {
  // ...existing code
  
  const updateResult = await supabaseClient
    .from('lessons')
    .update({ 
      mux_asset_id: assetId,
      mux_playback_id: playbackId,
      video_processing_status: 'ready',
      status: 'published'  // Automatically publish when video is ready
    })
    .eq('mux_asset_id', assetId);
}
```

## Testing Requirements

1. **Video Upload Testing**:
   - Test uploading videos of different sizes and formats
   - Verify `mux_asset_id` and `mux_playback_id` are correctly set
   - Verify video processing status is accurately tracked
   - Test webhook handling with simulated webhook events

2. **Stripe Integration Testing**:
   - Test creating paid lessons with verified Stripe accounts
   - Verify `stripe_product_id` and `stripe_price_id` are correctly set
   - Test creating paid lessons with unverified Stripe accounts (should fail)
   - Test creating paid lessons with no Stripe account (should fail)

3. **Error Handling Testing**:
   - Test behavior when Mux upload fails
   - Test behavior when Stripe product/price creation fails
   - Test behavior when database operations fail
   - Verify appropriate error messages are displayed to users

4. **End-to-End Testing**:
   - Create a lesson with video and verify it can be viewed
   - Create a paid lesson and verify it can be purchased
   - Verify lesson status updates correctly throughout the process

## Priority

**High** - These issues affect core platform functionality, data integrity, and monetization capabilities. They should be addressed before any further deployment to production.

## Additional Context

This issue aligns with our core philosophy as stated in the documentation:
- "Modularity": Each component should have a single responsibility
- "Type Safety": Leverage TypeScript for robust, maintainable code
- "Security": Security is a fundamental consideration
- "Error Handling": Consistent error handling patterns
- "Production Quality": NEVER use temporary workarounds, mock data, or hardcoded values in production environments

The current implementation with placeholder values and incomplete validation violates these principles and must be fixed.
