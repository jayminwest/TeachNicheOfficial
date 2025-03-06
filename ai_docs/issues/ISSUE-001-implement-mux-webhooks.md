# Issue: Implement Mux Webhooks for Video Processing Status Updates

## Description

Currently, our application uses a polling approach to check when a video uploaded to Mux is ready for playback. This approach has several drawbacks:

1. It's inefficient and creates unnecessary API calls to Mux
2. It can miss status updates if polling intervals are too long
3. It doesn't scale well with multiple concurrent uploads
4. It doesn't provide real-time updates to users

According to Mux documentation, the recommended approach is to use webhooks to receive asynchronous notifications about video processing status changes.

## Current Implementation

The current implementation:

1. Uses Mux Uploader to upload videos
2. Stores the asset ID in the form/database
3. Attempts to poll for asset status using `pollAssetStatus` function
4. Tries to update the lesson with the playback ID when available

This approach is unreliable and doesn't follow Mux's recommended best practices.

## Proposed Solution

Implement a webhook-based approach following Mux's recommended flow:

1. **Set up a webhook endpoint** in our application to receive events from Mux
2. **Configure webhooks in the Mux dashboard** to send events to our endpoint
3. **Store the upload ID** when a video upload completes
4. **Handle webhook events** to update our database:
   - `video.upload.asset_created` - When the upload completes and an asset is created
   - `video.asset.ready` - When the video is processed and ready for playback

## Implementation Steps

### 1. Create a webhook endpoint

Create a new API route at `app/api/webhooks/mux/route.ts` to handle incoming webhook events from Mux:

```typescript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type;
    
    console.log(`Received Mux webhook: ${type}`);
    
    // Create Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    if (type === 'video.upload.asset_created') {
      const uploadId = body.data.upload_id;
      const assetId = body.data.asset_id;
      
      console.log(`Upload ${uploadId} created asset ${assetId}`);
      
      // Update the lesson with the asset ID
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_asset_id: assetId,
          status: 'processing'
        })
        .eq('mux_upload_id', uploadId);
      
      if (error) {
        console.error('Error updating lesson with asset ID:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
    }
    
    if (type === 'video.asset.ready') {
      const assetId = body.data.id;
      const playbackId = body.data.playback_ids?.[0]?.id;
      
      if (!playbackId) {
        console.error('No playback ID found in asset.ready event');
        return NextResponse.json({ error: 'No playback ID found' }, { status: 400 });
      }
      
      console.log(`Asset ${assetId} is ready with playback ID ${playbackId}`);
      
      // Update the lesson with the playback ID and set status to published
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_playback_id: playbackId,
          status: 'published'
        })
        .eq('mux_asset_id', assetId);
      
      if (error) {
        console.error('Error updating lesson with playback ID:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
```

### 2. Modify the VideoUploader component

Update the VideoUploader component to store the upload ID in the database:

```typescript
<MuxUploader
  endpoint={uploadEndpoint}
  onUploadStart={handleUploadStart}
  onProgress={handleUploadProgress}
  onSuccess={(event) => {
    console.log("MuxUploader onSuccess event:", event);
    
    // Use the stored upload ID directly instead of trying to extract it from the URL
    const uploadId = (window as any).__lastUploadId;
    
    if (!uploadId) {
      console.error("No upload ID found in global storage");
      handleUploadError(new Error("Upload ID not found"));
      return;
    }
    
    console.log("Using stored upload ID:", uploadId);
    
    // Store the upload ID in the database
    if (lessonId) {
      fetch('/api/lessons/update-upload-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          muxUploadId: uploadId
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to update lesson with upload ID');
        }
        return response.json();
      }).catch(error => {
        console.error('Error updating lesson with upload ID:', error);
      });
    }
    
    // Call the original success handler
    handleUploadSuccess(uploadId);
  }}
  // ... other props
/>
```

### 3. Create an API endpoint to update the lesson with the upload ID

Create a new API route at `app/api/lessons/update-upload-id/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { lessonId, muxUploadId } = await request.json();
    
    if (!lessonId || !muxUploadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Update the lesson with the upload ID
    const { error } = await supabase
      .from('lessons')
      .update({ 
        mux_upload_id: muxUploadId,
        status: 'uploading'
      })
      .eq('id', lessonId);
    
    if (error) {
      console.error('Error updating lesson with upload ID:', error);
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson with upload ID:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}
```

### 4. Update the LessonForm component

Modify the LessonForm component to handle the upload completion:

```typescript
<VideoUploader
  endpoint="/api/mux/upload"
  onUploadComplete={async (assetId) => {
    console.log("LessonForm received assetId:", assetId);
    try {
      // Set the muxAssetId in the form
      form.setValue("muxAssetId", assetId, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      console.log("Set muxAssetId in form:", assetId);
      
      // Clear any existing playback ID to ensure we don't use a stale one
      form.setValue("muxPlaybackId", "", {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      toast({
        title: "Video uploaded",
        description: "Your video has been uploaded and is now processing. You'll be notified when it's ready.",
      });
    } catch (error) {
      toast({
        title: "Upload processing error",
        description: error instanceof Error ? error.message : "Failed to process video",
        variant: "destructive",
      });
    }
  }}
  // ... other props
/>
```

### 5. Configure webhooks in the Mux dashboard

1. Go to the Mux dashboard
2. Navigate to the Webhooks section
3. Create a new webhook with the following settings:
   - URL: `https://your-domain.com/api/webhooks/mux`
   - Events: `video.upload.asset_created` and `video.asset.ready`
   - Format: JSON

## Benefits

1. **Efficiency**: No more polling, reducing API calls and server load
2. **Reliability**: Real-time updates when video status changes
3. **Scalability**: Handles multiple concurrent uploads without issues
4. **User Experience**: Provides accurate status updates to users

## Testing

1. Upload a video through the application
2. Verify that the upload ID is stored in the database
3. Check logs for webhook events
4. Verify that the asset ID and playback ID are updated in the database
5. Confirm that the video is playable when processing is complete

## Security Considerations

For production, implement webhook signature verification to ensure that webhook events are actually coming from Mux:

```typescript
// Verify webhook signature
const signature = request.headers.get('mux-signature');
if (!signature) {
  return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
}

// Implement signature verification logic here
```

## References

- [Mux Uploader Documentation](https://www.mux.com/docs/guides/mux-uploader
- [Mux Webhooks Documentation](https://www.mux.com/docs/core/listen-for-webhooks
- [Mux Webhook Signature Verification](https://www.mux.com/docs/core/verify-webhook-signatures
