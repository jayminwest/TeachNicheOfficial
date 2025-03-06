# Issue: Improve Lesson Creation Flow with Asynchronous Video Processing

## Description
Currently, the lesson creation process requires users to remain on the page until Mux completes video processing. This creates a poor user experience as video processing can take several minutes. We need to modify the flow to allow users to publish lessons and navigate away while video processing continues in the background, with the lesson's status and Mux information being updated automatically once processing completes.

## Technical Analysis

### Current Implementation Issues

1. **Lesson Status Management**: 
   - Lessons are created with a default status of 'draft' in the database
   - The lesson-form component doesn't explicitly set the status to 'published' when submitting
   - There's no clear transition from 'draft' to 'published' in the UI

2. **Video Processing Coupling**:
   - The `useVideoUpload` hook handles video upload and processing synchronously
   - Users must wait for processing to complete before the form submission can finish
   - The temporary playback ID workaround (`temp_playback_${assetId}`) is used but never updated with the real ID

3. **Missing Background Processing**:
   - No mechanism exists to update the lesson with the correct Mux playback ID after the user navigates away
   - No webhook or polling system to handle Mux processing completion events

### Required Changes

1. **Database and API Updates**:
   - Utilize the existing `status` field in the lessons table (already defaults to 'draft')
   - Add a new field to track video processing status separately from lesson publication status
   - Modify the lesson creation/update API to handle these status fields appropriately

2. **Background Processing Implementation**:
   - Implement a webhook endpoint for Mux notifications or a polling mechanism
   - Create a background process to update lesson records when video processing completes
   - Add status tracking for video processing that persists across page navigations

3. **Frontend Improvements**:
   - Update the lesson form to allow explicit publishing (changing status from 'draft' to 'published')
   - Modify the video uploader to initiate but not wait for processing completion
   - Add UI indicators for lesson status and video processing status

## Affected Files

1. `app/api/lessons/route.ts`:
   - Update the `createLessonHandler` function to handle the video processing status
   - Add logic to set the initial status correctly based on video upload state

2. `app/components/ui/lesson-form.tsx`:
   - Add explicit status control (draft/publish) in the form
   - Modify submission logic to handle asynchronous video processing

3. `app/hooks/use-video-upload.ts`:
   - Refactor to support background processing
   - Add functionality to store upload state that can be retrieved later

4. `app/services/mux.ts`:
   - Implement webhook handling or polling mechanism
   - Add functions to update lesson records when processing completes

5. `app/api/mux/webhook/route.ts` (new file):
   - Create a webhook endpoint to receive Mux processing notifications
   - Update lesson records based on webhook data

6. Database migration:
   - Add a new field for video processing status if needed

## Implementation Approach

### 1. Database and API Updates

```sql
-- Add video_processing_status field if not already present
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_processing_status TEXT DEFAULT 'pending';
```

In `app/api/lessons/route.ts`, modify the `createLessonHandler`:

```typescript
// Update the lesson data structure
const lessonData = {
  // ... existing fields
  status: body.status || 'draft', // Allow explicit status setting
  video_processing_status: muxAssetId ? 'processing' : 'none',
  // ... other fields
};
```

### 2. Background Processing

Create a new file `app/api/mux/webhook/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Verify webhook signature (implementation depends on Mux's webhook format)
    
    // Handle video.asset.ready event
    if (payload.type === 'video.asset.ready') {
      const assetId = payload.data.id;
      const playbackId = payload.data.playback_ids[0].id;
      
      // Update the lesson with the real playback ID
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_playback_id: playbackId,
          video_processing_status: 'complete'
        })
        .eq('mux_asset_id', assetId);
      
      if (error) {
        console.error('Failed to update lesson with playback ID:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### 3. Frontend Updates

In `app/components/ui/lesson-form.tsx`, add status controls:

```tsx
<FormField
  control={form.control}
  name="status"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Publication Status</FormLabel>
      <Select
        onValueChange={field.onChange}
        defaultValue={field.value}
        disabled={isSubmitting}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Save as Draft</SelectItem>
          <SelectItem value="published">Publish Now</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>
        Draft lessons are not visible to students. Published lessons are available for purchase.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

In `app/hooks/use-video-upload.ts`, modify to support background processing:

```typescript
// Add function to store upload state in localStorage
const storeUploadState = (uploadId: string, assetId: string) => {
  try {
    localStorage.setItem(`upload_${uploadId}`, JSON.stringify({
      assetId,
      timestamp: Date.now(),
      status: 'processing'
    }));
  } catch (e) {
    console.error('Failed to store upload state:', e);
  }
};

// In handleUploadSuccess function:
handleUploadSuccess = useCallback(async (uploadId: string) => {
  try {
    // ... existing code
    
    // Store the upload state for background processing
    storeUploadState(uploadId, assetId);
    
    // Set status to complete without waiting for full processing
    setStatus('complete');
    setProgress(100);
    if (onProgress) onProgress(100);
    
    if (onUploadComplete) {
      onUploadComplete(assetId);
    }
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
  }
}, [handleError, onProgress, onUploadComplete]);
```

## Testing Requirements

1. **Unit Tests**:
   - Test lesson status transitions (draft → published)
   - Test video processing status tracking
   - Test Mux webhook handling

2. **Integration Tests**:
   - Test the complete lesson creation flow with video upload
   - Verify database updates correctly after navigating away
   - Test webhook endpoint with simulated Mux events

3. **End-to-End Tests**:
   - Create a lesson with video, navigate away, and verify it processes correctly
   - Attempt to purchase lessons in various states to verify protection
   - Test the user experience of the entire flow

## Additional Context

This improvement will significantly enhance the user experience for content creators by removing unnecessary waiting time during the lesson creation process. It aligns with our core philosophy of providing a seamless platform for instructors to monetize their specialized knowledge.

The implementation should follow our established patterns for asynchronous processing and maintain type safety throughout. We should also consider adding appropriate error handling and retry mechanisms for the background processing to ensure reliability.
