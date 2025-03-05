# Issue: Lesson Status Not Updating from Draft to Published After Video Processing

## Description

Lessons are currently being assigned a status of "draft" upon creation, but this status is not automatically updating to "published" when the video processing is complete. Additionally, the Mux playback ID is not being properly assigned to the lesson after video processing is complete, with temporary variables being used instead of the actual Mux data.

## Technical Analysis

After examining the code, I've identified several specific issues:

1. In `app/hooks/use-video-upload.ts`, the `handleUploadSuccess` function is using temporary asset IDs and playback IDs when it can't retrieve the real ones:

```typescript
// For errors, create a minimal asset data object
assetData = {
  playbackId: `temp_playback_${assetId.replace(/^temp_/, '')}`,
  status: 'preparing'
};
```

2. The `onUploadComplete` callback is being called with the asset ID, but there's no code that updates the lesson status from "draft" to "published" after this callback is triggered.

3. In `app/services/mux.ts`, the `waitForAssetReady` function correctly waits for the asset to be ready, but this information isn't being used to update the lesson status.

4. The video uploader component is successfully handling the upload process, but the completion of this process isn't triggering a database update to change the lesson status.

5. The current implementation is using a workaround for Mux API issues by creating temporary asset IDs:

```typescript
// Skip API calls for now and use a temporary asset ID
console.log("Using upload ID as temporary asset ID");
const tempAssetId = `temp_${cleanUploadId}`;
```

## Root Cause

The root cause appears to be a disconnect between the video upload/processing flow and the lesson status management. When a video is uploaded and processed by Mux, the application needs to:

1. Get the real Mux asset ID and playback ID
2. Update the lesson record with this information
3. Change the lesson status from "draft" to "published"

Currently, the code is using temporary IDs as placeholders, but there's no mechanism to replace these with real IDs and update the lesson status once processing is complete.

## Affected Files

1. `app/hooks/use-video-upload.ts` - Using temporary asset and playback IDs
2. `app/components/ui/video-uploader.tsx` - Not triggering lesson status update on completion
3. `app/services/mux.ts` - Not providing a mechanism to update lesson status after asset is ready
4. Missing API endpoint to update lesson status and Mux information

## Reproduction Steps

1. Log in as an instructor
2. Navigate to the lesson creation page
3. Fill in lesson details and upload a video
4. Complete the lesson creation process
5. Observe that the lesson remains in "draft" status indefinitely
6. Check the database to see that `mux_playback_id` contains a temporary ID (starting with `temp_playback_`) rather than a real Mux playback ID

## Expected Behavior

1. When a lesson is first created, it should be set to "draft" status
2. After the video is successfully processed by Mux, the status should automatically update to "published"
3. The correct Mux information (asset ID and playback ID) should be stored in the lesson record
4. The lesson should become visible to students once published

## Proposed Solution

### 1. Create a Robust Asset Tracking System

Create a new table in the database to track Mux asset processing:

```sql
CREATE TABLE mux_asset_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  upload_id TEXT NOT NULL,
  temp_asset_id TEXT,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id)
);
```

### 2. Create New API Endpoints

#### a. Track Upload Initiation

```typescript
// app/api/mux/track-upload/route.ts
export async function POST(request: Request) {
  const { lessonId, uploadId, tempAssetId } = await request.json();
  
  // Insert tracking record
  const { data, error } = await supabase
    .from('mux_asset_tracking')
    .insert({
      lesson_id: lessonId,
      upload_id: uploadId,
      temp_asset_id: tempAssetId,
      status: 'processing'
    })
    .select();
  
  // Return response
}
```

#### b. Update Asset Information

```typescript
// app/api/mux/update-asset/route.ts
export async function POST(request: Request) {
  const { lessonId, muxAssetId, muxPlaybackId } = await request.json();
  
  // Update tracking record
  await supabase
    .from('mux_asset_tracking')
    .update({
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      status: 'ready',
      updated_at: new Date().toISOString()
    })
    .eq('lesson_id', lessonId);
  
  // Update lesson record
  await supabase
    .from('lessons')
    .update({
      status: 'published',
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      updated_at: new Date().toISOString()
    })
    .eq('id', lessonId);
  
  // Return response
}
```

#### c. Polling Endpoint for Asset Status

```typescript
// app/api/mux/check-asset-status/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');
  
  // Get tracking record
  const { data, error } = await supabase
    .from('mux_asset_tracking')
    .select('*')
    .eq('lesson_id', lessonId)
    .single();
  
  if (data?.mux_asset_id && !data.mux_playback_id) {
    // We have an asset ID but no playback ID - get it from Mux
    const playbackId = await getPlaybackId(data.mux_asset_id);
    
    if (playbackId) {
      // Update records with playback ID
      await updateAssetInfo(lessonId, data.mux_asset_id, playbackId);
      
      return NextResponse.json({
        status: 'ready',
        playbackId
      });
    }
  }
  
  // Return current status
  return NextResponse.json({
    status: data?.status || 'unknown',
    playbackId: data?.mux_playback_id
  });
}
```

### 3. Modify the Video Upload Hook

Update `app/hooks/use-video-upload.ts` to:

```typescript
// Add lessonId parameter to the hook
export function useVideoUpload({
  endpoint = '/api/mux/upload',
  onUploadComplete,
  onError,
  onProgress,
  lessonId  // Add this parameter
}: UseVideoUploadOptions = {}): UseVideoUploadReturn {
  // ...existing code...
  
  const handleUploadSuccess = useCallback(async (uploadId: string) => {
    try {
      // ...existing code to clean uploadId...
      
      // Track this upload with the lesson
      if (lessonId) {
        await fetch('/api/mux/track-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            uploadId: cleanUploadId,
            tempAssetId: `temp_${cleanUploadId}`
          })
        });
      }
      
      // ...existing code...
      
      // Start polling for real asset information
      if (lessonId) {
        startPollingAssetStatus(lessonId);
      }
      
      // ...existing code...
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
    }
  }, [handleError, onProgress, onUploadComplete, lessonId]);
  
  // Add a polling function
  const startPollingAssetStatus = useCallback((lessonId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes at 10-second intervals
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/mux/check-asset-status?lessonId=${lessonId}`);
        const data = await response.json();
        
        if (data.status === 'ready' && data.playbackId) {
          // Success! The lesson should now be published
          return;
        }
        
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        }
      } catch (error) {
        console.error('Error checking asset status:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000);
        }
      }
    };
    
    // Start polling
    checkStatus();
  }, []);
  
  // ...rest of the hook...
}
```

### 4. Update the Video Uploader Component

Modify `app/components/ui/video-uploader.tsx` to pass the lesson ID to the hook:

```typescript
export function VideoUploader({ 
  endpoint,
  onUploadComplete, 
  onError,
  onUploadStart,
  maxSizeMB = 2000,
  maxResolution = { width: 1920, height: 1080 },
  acceptedTypes = ['video/mp4', 'video/quicktime', 'video/heic', 'video/heif'],
  className,
  pausable = false,
  noDrop = false,
  chunkSize,
  dynamicChunkSize = false,
  useLargeFileWorkaround = false,
  lessonId  // Add this parameter
}: VideoUploaderProps) {
  // ...existing code...
  
  const {
    status,
    progress,
    error: errorMessage,
    uploadEndpoint,
    handleUploadStart: startUpload,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError,
  } = useVideoUpload({
    onUploadComplete,
    onError,
    onProgress: (progress) => {
      if (progress === 100) {
        onUploadStart?.();
      }
    },
    lessonId  // Pass the lesson ID to the hook
  });
  
  // ...rest of the component...
}
```

### 5. Create a Background Job for Existing Lessons

Create a one-time script to fix existing lessons with temporary IDs:

```typescript
// scripts/fix-lesson-status.ts
async function fixLessonStatus() {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'draft')
    .like('mux_playback_id', 'temp_playback_%');
  
  if (error) {
    console.error('Error fetching lessons:', error);
    return;
  }
  
  console.log(`Found ${lessons.length} lessons with temporary playback IDs`);
  
  for (const lesson of lessons) {
    try {
      // Check if we have a real asset ID
      if (lesson.mux_asset_id && !lesson.mux_asset_id.startsWith('temp_')) {
        // Get the real playback ID
        const playbackId = await getPlaybackId(lesson.mux_asset_id);
        
        if (playbackId) {
          // Update the lesson
          await supabase
            .from('lessons')
            .update({
              status: 'published',
              mux_playback_id: playbackId,
              updated_at: new Date().toISOString()
            })
            .eq('id', lesson.id);
          
          console.log(`Updated lesson ${lesson.id} with playback ID ${playbackId}`);
        }
      }
    } catch (error) {
      console.error(`Error processing lesson ${lesson.id}:`, error);
    }
  }
}
```

### 6. Enhance Mux Service with Better Error Handling

Update `app/services/mux.ts` to provide more robust error handling:

```typescript
export async function getAssetStatus(assetId: string): Promise<MuxAssetResponse> {
  // Ensure client is initialized
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.assets) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  // Don't try to get status for temporary asset IDs
  if (assetId.startsWith('temp_')) {
    return {
      id: assetId,
      status: 'preparing',
      error: {
        message: 'This is a temporary asset ID',
        type: 'temp_asset'
      }
    };
  }

  try {
    const asset = await muxClient.video.assets.get(assetId);
    
    if (!asset) {
      throw new Error('Mux API returned null or undefined asset');
    }
    
    return {
      id: asset.id,
      status: asset.status as 'preparing' | 'ready' | 'errored',
      playbackId: asset.playback_ids?.[0]?.id,
      error: undefined
    };
  } catch (error) {
    console.error('Mux API error:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to get asset status: ${error.message}`
        : 'Failed to get asset status'
    );
  }
}
```

## Implementation Plan

1. **Database Changes**:
   - Create the `mux_asset_tracking` table to track asset processing

2. **API Endpoints**:
   - Create `/api/mux/track-upload` endpoint
   - Create `/api/mux/update-asset` endpoint
   - Create `/api/mux/check-asset-status` endpoint

3. **Code Updates**:
   - Modify `useVideoUpload` hook to track lesson ID and poll for status
   - Update `VideoUploader` component to pass lesson ID
   - Enhance Mux service with better error handling

4. **Migration**:
   - Create and run a script to fix existing lessons with temporary IDs

5. **Testing**:
   - Test the complete flow from lesson creation to publishing
   - Verify that existing lessons are properly updated
   - Test error scenarios and recovery

## Testing Requirements

1. **Unit Tests**:
   - Test the new API endpoints with various input scenarios
   - Test the enhanced Mux service functions

2. **Integration Tests**:
   - Test the complete lesson creation flow
   - Test the video upload and processing flow
   - Test the status update mechanism

3. **End-to-End Tests**:
   - Create a new lesson and verify it starts in "draft" status
   - Upload a video and confirm the status changes to "published" after processing completes
   - Verify the correct Mux playback ID (not a temporary ID) is stored in the lesson record

4. **Error Handling Tests**:
   - Test with network failures during upload
   - Test with Mux API failures
   - Test with database failures

## Additional Context

This issue affects the core functionality of the platform, as lessons remain invisible to students until published. The current implementation using temporary IDs was likely a workaround for issues with the Mux API integration, but it needs to be replaced with a more robust solution that ensures lessons are properly published once video processing is complete.

The proposed solution not only fixes the immediate issue but also adds a tracking system that will make the video processing flow more resilient and easier to debug in the future.
