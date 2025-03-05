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

Create a new table in the database to track Mux asset processing with proper constraints and typing:

```sql
-- Create an enum for asset status to ensure data integrity
CREATE TYPE mux_asset_status AS ENUM ('processing', 'ready', 'error');

CREATE TABLE mux_asset_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL,
  temp_asset_id TEXT,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  status mux_asset_status NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Add indexes for performance
CREATE INDEX idx_mux_asset_tracking_upload_id ON mux_asset_tracking(upload_id);
CREATE INDEX idx_mux_asset_tracking_temp_asset_id ON mux_asset_tracking(temp_asset_id);
```

**Note on RLS**: Since all tables have RLS enabled, we'll need to configure appropriate policies:

```sql
-- Allow instructors to view and manage their own asset tracking records
CREATE POLICY "Instructors can manage their own asset tracking records" ON mux_asset_tracking
  USING (lesson_id IN (SELECT id FROM lessons WHERE creator_id = auth.uid()))
  WITH CHECK (lesson_id IN (SELECT id FROM lessons WHERE creator_id = auth.uid()));

-- Allow service roles full access for background processing
CREATE POLICY "Service role has full access" ON mux_asset_tracking
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

### 2. Create New API Endpoints with Robust Error Handling

#### a. Track Upload Initiation

```typescript
// app/api/mux/track-upload/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/services/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { lessonId, uploadId, tempAssetId } = await request.json();
    
    // Validate inputs
    if (!lessonId || !uploadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if lesson exists and user has permission (RLS will handle this)
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, creator_id')
      .eq('id', lessonId)
      .single();
      
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found or permission denied' },
        { status: 404 }
      );
    }
    
    // Insert tracking record with conflict handling
    const { data, error } = await supabase
      .from('mux_asset_tracking')
      .upsert({
        lesson_id: lessonId,
        upload_id: uploadId,
        temp_asset_id: tempAssetId,
        status: 'processing',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'lesson_id',
        returning: 'minimal'
      });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to track upload' },
        { status: 500 }
      );
    }
    
    // Log the event for monitoring
    console.log(`[VIDEO PROCESSING] Upload tracked for lesson ${lessonId} with upload ID ${uploadId}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in track-upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### b. Update Asset Information with Transaction Support

```typescript
// app/api/mux/update-asset/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/services/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { lessonId, muxAssetId, muxPlaybackId } = await request.json();
    
    // Validate inputs
    if (!lessonId || !muxAssetId || !muxPlaybackId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Use a transaction to update both tables
    // Since we can't use actual DB transactions with Supabase REST API,
    // we'll do this in sequence with error handling
    
    // First update the tracking record
    const { error: trackingError } = await supabase
      .from('mux_asset_tracking')
      .update({
        mux_asset_id: muxAssetId,
        mux_playback_id: muxPlaybackId,
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('lesson_id', lessonId);
    
    if (trackingError) {
      console.error('Error updating tracking record:', trackingError);
      return NextResponse.json(
        { error: 'Failed to update asset tracking' },
        { status: 500 }
      );
    }
    
    // Then update the lesson record
    const { error: lessonError } = await supabase
      .from('lessons')
      .update({
        status: 'published',
        mux_asset_id: muxAssetId,
        mux_playback_id: muxPlaybackId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);
    
    if (lessonError) {
      console.error('Error updating lesson record:', lessonError);
      
      // Try to revert the tracking update
      await supabase
        .from('mux_asset_tracking')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId);
      
      return NextResponse.json(
        { error: 'Failed to update lesson status' },
        { status: 500 }
      );
    }
    
    // Log the successful update
    console.log(`[VIDEO PROCESSING] Lesson ${lessonId} published with Mux playback ID ${muxPlaybackId}`);
    
    return NextResponse.json({ 
      success: true,
      lessonId,
      muxPlaybackId
    });
  } catch (error) {
    console.error('Unexpected error in update-asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### c. Polling Endpoint for Asset Status with Improved Error Classification

```typescript
// app/api/mux/check-asset-status/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/services/supabase/server';
import { getAssetStatus, getPlaybackId } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }
    
    // Get tracking record
    const { data, error } = await supabase
      .from('mux_asset_tracking')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return NextResponse.json({
          status: 'unknown',
          error: 'No tracking record found'
        });
      }
      
      console.error('Error fetching tracking record:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }
    
    // If we have a real asset ID but no playback ID, try to get it from Mux
    if (data?.mux_asset_id && !data.mux_asset_id.startsWith('temp_') && !data.mux_playback_id) {
      try {
        const assetStatus = await getAssetStatus(data.mux_asset_id);
        
        if (assetStatus.status === 'ready' && assetStatus.playbackId) {
          // We have a playback ID - update records
          const response = await fetch('/api/mux/update-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId,
              muxAssetId: data.mux_asset_id,
              muxPlaybackId: assetStatus.playbackId
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update asset info');
          }
          
          return NextResponse.json({
            status: 'ready',
            playbackId: assetStatus.playbackId
          });
        }
        
        // Asset is still processing or has an error
        return NextResponse.json({
          status: assetStatus.status,
          error: assetStatus.error
        });
      } catch (muxError) {
        console.error('Error getting Mux asset status:', muxError);
        
        // Update the tracking record with the error
        await supabase
          .from('mux_asset_tracking')
          .update({
            status: 'error',
            error_message: muxError instanceof Error ? muxError.message : 'Unknown Mux API error',
            updated_at: new Date().toISOString()
          })
          .eq('lesson_id', lessonId);
        
        return NextResponse.json({
          status: 'error',
          error: {
            message: muxError instanceof Error ? muxError.message : 'Unknown Mux API error',
            type: 'mux_api_error'
          }
        });
      }
    }
    
    // Return current status
    return NextResponse.json({
      status: data?.status || 'unknown',
      playbackId: data?.mux_playback_id,
      error: data?.error_message ? { message: data.error_message } : undefined
    });
  } catch (error) {
    console.error('Unexpected error in check-asset-status:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          type: 'server_error'
        }
      },
      { status: 500 }
    );
  }
}
```

### 3. Implement Separate Hooks for Better Separation of Concerns

#### a. Create a dedicated hook for asset status polling

```typescript
// app/hooks/use-asset-status-polling.ts
import { useCallback, useEffect, useState } from 'react';

interface UseAssetStatusPollingOptions {
  onStatusChange?: (status: 'processing' | 'ready' | 'error', data?: any) => void;
  onError?: (error: Error) => void;
  initialDelay?: number;
  maxDelay?: number;
  maxAttempts?: number;
}

export function useAssetStatusPolling({
  onStatusChange,
  onError,
  initialDelay = 5000,
  maxDelay = 30000,
  maxAttempts = 60
}: UseAssetStatusPollingOptions = {}) {
  const [isPolling, setIsPolling] = useState(false);
  
  const startPollingAssetStatus = useCallback((lessonId: string) => {
    let attempts = 0;
    let currentDelay = initialDelay;
    let timeoutId: NodeJS.Timeout | null = null;
    
    setIsPolling(true);
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/mux/check-asset-status?lessonId=${lessonId}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Notify about status change
        onStatusChange?.(data.status, data);
        
        if (data.status === 'ready' && data.playbackId) {
          // Success! The lesson should now be published
          setIsPolling(false);
          return;
        }
        
        if (data.status === 'error') {
          console.error('Asset processing error:', data.error);
          onError?.(new Error(data.error?.message || 'Asset processing failed'));
          setIsPolling(false);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.warn('Max polling attempts reached');
          onError?.(new Error('Max polling attempts reached'));
          setIsPolling(false);
          return;
        }
        
        // Schedule next check with exponential backoff
        attempts++;
        currentDelay = Math.min(currentDelay * 1.5, maxDelay);
        timeoutId = setTimeout(checkStatus, currentDelay);
      } catch (error) {
        console.error('Error checking asset status:', error);
        
        if (error instanceof Error) {
          onError?.(error);
        } else {
          onError?.(new Error('Unknown error checking asset status'));
        }
        
        if (attempts >= maxAttempts) {
          setIsPolling(false);
          return;
        }
        
        // Retry with backoff even after errors
        attempts++;
        currentDelay = Math.min(currentDelay * 1.5, maxDelay);
        timeoutId = setTimeout(checkStatus, currentDelay);
      }
    };
    
    // Start checking immediately
    checkStatus();
    
    // Return cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      setIsPolling(false);
    };
  }, [initialDelay, maxDelay, maxAttempts, onStatusChange, onError]);
  
  return { 
    startPollingAssetStatus,
    isPolling
  };
}
```

#### b. Modify the Video Upload Hook with Better Error Handling

```typescript
// app/hooks/use-video-upload.ts
import { useState, useCallback, useEffect } from 'react';
import { useAssetStatusPolling } from './use-asset-status-polling';

interface UseVideoUploadOptions {
  endpoint?: string;
  onUploadComplete?: (assetId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  lessonId?: string;
}

export function useVideoUpload({
  endpoint = '/api/mux/upload',
  onUploadComplete,
  onError,
  onProgress,
  lessonId
}: UseVideoUploadOptions = {}): UseVideoUploadReturn {
  // ...existing state variables...
  
  const { startPollingAssetStatus, isPolling } = useAssetStatusPolling({
    onStatusChange: (status, data) => {
      if (status === 'ready' && data?.playbackId) {
        // Update local state with real playback ID
        setAssetData(prev => ({
          ...prev,
          playbackId: data.playbackId,
          status: 'ready'
        }));
      }
    },
    onError: (error) => {
      handleError(error);
    }
  });
  
  // Add state for polling cleanup
  const [pollingCleanup, setPollingCleanup] = useState<(() => void) | null>(null);
  
  const handleUploadSuccess = useCallback(async (uploadId: string) => {
    try {
      // Clean upload ID (existing code)
      const cleanUploadId = uploadId.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Track this upload with the lesson
      if (lessonId) {
        const response = await fetch('/api/mux/track-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            uploadId: cleanUploadId,
            tempAssetId: `temp_${cleanUploadId}`
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to track upload: ${errorData.error || response.status}`);
        }
      }
      
      // Existing code for handling asset data...
      
      // Start polling for real asset information
      if (lessonId) {
        const cleanup = startPollingAssetStatus(lessonId);
        setPollingCleanup(() => cleanup);
      }
      
      // Call the completion callback
      if (onUploadComplete) {
        onUploadComplete(assetId);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
    }
  }, [handleError, onUploadComplete, lessonId, startPollingAssetStatus]);
  
  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingCleanup) pollingCleanup();
    };
  }, [pollingCleanup]);
  
  // ...rest of the hook...
  
  return {
    // ...existing return values...
    isPollingStatus: isPolling
  };
}
```

### 4. Update the Video Uploader Component with Required Props Validation

```typescript
// app/components/ui/video-uploader.tsx
import { useEffect } from 'react';
import { useVideoUpload } from '@/app/hooks/use-video-upload';

interface VideoUploaderProps {
  endpoint?: string;
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  onUploadStart?: () => void;
  maxSizeMB?: number;
  maxResolution?: { width: number; height: number };
  acceptedTypes?: string[];
  className?: string;
  pausable?: boolean;
  noDrop?: boolean;
  chunkSize?: number;
  dynamicChunkSize?: boolean;
  useLargeFileWorkaround?: boolean;
  lessonId?: string;
  requiresLessonId?: boolean;
}

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
  lessonId,
  requiresLessonId = false
}: VideoUploaderProps) {
  // Validate props
  useEffect(() => {
    if (requiresLessonId && !lessonId) {
      console.error('VideoUploader: lessonId is required when requiresLessonId is true');
      onError(new Error('Lesson ID is required for video upload'));
    }
  }, [requiresLessonId, lessonId, onError]);
  
  const {
    status,
    progress,
    error: errorMessage,
    uploadEndpoint,
    handleUploadStart: startUpload,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError,
    isPollingStatus
  } = useVideoUpload({
    endpoint,
    onUploadComplete,
    onError,
    onProgress: (progress) => {
      if (progress === 100) {
        onUploadStart?.();
      }
    },
    lessonId
  });
  
  // ...rest of the component...
  
  // Add visual indication of processing status
  const renderStatus = () => {
    if (status === 'uploading') {
      return (
        <div className="text-sm text-blue-600">
          Uploading: {progress.toFixed(0)}%
        </div>
      );
    }
    
    if (status === 'success' && isPollingStatus) {
      return (
        <div className="text-sm text-amber-600">
          Upload complete. Processing video...
        </div>
      );
    }
    
    if (status === 'success' && !isPollingStatus) {
      return (
        <div className="text-sm text-green-600">
          Video ready
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="text-sm text-red-600">
          {errorMessage || 'Upload failed'}
        </div>
      );
    }
    
    return null;
  };
  
  // ...render component with status...
}
```

### 5. Create a Robust Migration Script for Existing Lessons

```typescript
// scripts/fix-lesson-status.ts
import { createClient } from '@supabase/supabase-js';
import { getAssetStatus } from '../app/services/mux';

async function fixLessonStatus() {
  console.log('Starting lesson status fix script...');
  
  // Initialize Supabase client with service role key for RLS bypass
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get all lessons with temporary playback IDs or draft status
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .or('status.eq.draft,mux_playback_id.like.temp_playback_%');
  
  if (error) {
    console.error('Error fetching lessons:', error);
    return;
  }
  
  console.log(`Found ${lessons.length} lessons to process`);
  
  // Statistics tracking
  const stats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0
  };
  
  // Process in batches to avoid overwhelming the Mux API
  const batchSize = 5;
  for (let i = 0; i < lessons.length; i += batchSize) {
    const batch = lessons.slice(i, i + batchSize);
    
    // Process batch concurrently
    await Promise.all(batch.map(async (lesson) => {
      try {
        stats.processed++;
        console.log(`Processing lesson ${lesson.id} (${stats.processed}/${lessons.length})`);
        
        // Skip lessons without any Mux asset ID
        if (!lesson.mux_asset_id) {
          console.log(`Skipping lesson ${lesson.id} - no Mux asset ID`);
          stats.skipped++;
          return;
        }
        
        // Skip lessons that already have a valid playback ID
        if (lesson.mux_playback_id && !lesson.mux_playback_id.startsWith('temp_')) {
          console.log(`Skipping lesson ${lesson.id} - already has valid playback ID`);
          stats.skipped++;
          return;
        }
        
        // Check if we have a real asset ID
        if (!lesson.mux_asset_id.startsWith('temp_')) {
          // Get the asset status from Mux
          console.log(`Checking status for asset ${lesson.mux_asset_id}`);
          const assetStatus = await getAssetStatus(lesson.mux_asset_id);
          
          if (assetStatus.status === 'ready' && assetStatus.playbackId) {
            // Update the lesson
            const { error: updateError } = await supabase
              .from('lessons')
              .update({
                status: 'published',
                mux_playback_id: assetStatus.playbackId,
                updated_at: new Date().toISOString()
              })
              .eq('id', lesson.id);
            
            if (updateError) {
              throw new Error(`Database update failed: ${updateError.message}`);
            }
            
            // Also create a tracking record if it doesn't exist
            await supabase
              .from('mux_asset_tracking')
              .upsert({
                lesson_id: lesson.id,
                upload_id: 'migrated',
                mux_asset_id: lesson.mux_asset_id,
                mux_playback_id: assetStatus.playbackId,
                status: 'ready',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'lesson_id'
              });
            
            console.log(`Updated lesson ${lesson.id} with playback ID ${assetStatus.playbackId}`);
            stats.updated++;
          } else if (assetStatus.status === 'errored') {
            console.log(`Asset ${lesson.mux_asset_id} has error: ${assetStatus.error?.message}`);
            stats.failed++;
            
            // Update tracking record with error
            await supabase
              .from('mux_asset_tracking')
              .upsert({
                lesson_id: lesson.id,
                upload_id: 'migrated',
                mux_asset_id: lesson.mux_asset_id,
                status: 'error',
                error_message: assetStatus.error?.message,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'lesson_id'
              });
          } else {
            console.log(`Asset ${lesson.mux_asset_id} is still processing (status: ${assetStatus.status})`);
            stats.skipped++;
            
            // Create tracking record for future processing
            await supabase
              .from('mux_asset_tracking')
              .upsert({
                lesson_id: lesson.id,
                upload_id: 'migrated',
                mux_asset_id: lesson.mux_asset_id,
                status: 'processing',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'lesson_id'
              });
          }
        } else {
          console.log(`Lesson ${lesson.id} has temporary asset ID ${lesson.mux_asset_id}`);
          stats.skipped++;
        }
      } catch (error) {
        console.error(`Error processing lesson ${lesson.id}:`, error);
        stats.failed++;
      }
    }));
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < lessons.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Print summary
  console.log('\nMigration Summary:');
  console.log(`Total lessons processed: ${stats.processed}`);
  console.log(`Successfully updated: ${stats.updated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
}

// Run the script if executed directly
if (require.main === module) {
  fixLessonStatus()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
```

### 6. Enhance Mux Service with Retry Logic and Better Error Classification

```typescript
// app/services/mux.ts
import Mux from '@mux/mux-node';

// Add retry functionality
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Determine if we should retry based on error type
    const shouldRetry = error instanceof Error && 
      (error.message.includes('timeout') || 
       error.message.includes('rate limit') ||
       error.message.includes('network'));
    
    if (!shouldRetry) throw error;
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff
    return withRetry(fn, retries - 1, delay * 2);
  }
}

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
    // Use retry logic for Mux API calls
    const asset = await withRetry(() => muxClient.video.assets.get(assetId));
    
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
    // Classify errors for better handling
    let errorType = 'unknown';
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('not found')) {
        errorType = 'not_found';
      } else if (errorMessage.includes('rate limit')) {
        errorType = 'rate_limit';
      } else if (errorMessage.includes('unauthorized')) {
        errorType = 'auth_error';
      } else if (errorMessage.includes('timeout')) {
        errorType = 'timeout';
      }
    }
    
    console.error(`Mux API error (${errorType}):`, error);
    
    return {
      id: assetId,
      status: 'errored',
      error: {
        message: errorMessage,
        type: errorType
      }
    };
  }
}
```

### 7. Add User Feedback Component for Video Processing Status

```typescript
// app/components/ui/video-processing-status.tsx
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/app/lib/utils';

interface VideoProcessingStatusProps {
  lessonId: string;
  className?: string;
  onStatusChange?: (status: 'processing' | 'ready' | 'error') => void;
}

export function VideoProcessingStatus({ 
  lessonId,
  className,
  onStatusChange
}: VideoProcessingStatusProps) {
  const [status, setStatus] = useState<'processing' | 'ready' | 'error'>('processing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!lessonId) return;
    
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/mux/check-asset-status?lessonId=${lessonId}`);
        
        if (!isMounted) return;
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'processing' || data.status === 'preparing') {
          setStatus('processing');
          // Increment progress for visual feedback (not actual progress)
          setProgress(prev => Math.min(prev + 5, 95));
        } else if (data.status === 'ready') {
          setStatus('ready');
          setProgress(100);
          
          // Notify parent component
          onStatusChange?.('ready');
          
          // Clear interval
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else if (data.status === 'error') {
          setStatus('error');
          setError(data.error?.message || 'An error occurred during processing');
          
          // Notify parent component
          onStatusChange?.('error');
          
          // Clear interval
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error checking status:', error);
        setError(error instanceof Error ? error.message : 'Failed to check processing status');
      }
    };
    
    // Check immediately
    checkStatus();
    
    // Then check periodically
    intervalId = setInterval(checkStatus, 5000);
    
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [lessonId, onStatusChange]);
  
  if (status === 'ready') {
    return (
      <div className={cn("text-green-600 flex items-center", className)}>
        <CheckCircleIcon className="w-5 h-5 mr-2" />
        Video processing complete
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className={cn("text-red-600", className)}>
        <div className="flex items-center">
          <ExclamationCircleIcon className="w-5 h-5 mr-2" />
          <span className="font-semibold">Video processing failed</span>
        </div>
        {error && <p className="text-sm mt-1">{error}</p>}
        <button 
          className="text-sm underline mt-2"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center text-amber-600">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing your video...
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500">
        This may take a few minutes depending on the video size
      </p>
    </div>
  );
}
```

### 8. Add Fallback Mechanism for Stuck Lessons

```typescript
// app/components/ui/lesson-status-controls.tsx
import { useState } from 'react';
import { Button } from './button';
import { AlertTriangleIcon } from 'lucide-react';

interface Lesson {
  id: string;
  status: string;
  mux_asset_id?: string;
  created_at: string;
}

interface LessonStatusControlsProps {
  lesson: Lesson;
  className?: string;
  onStatusChange?: () => void;
}

export function LessonStatusControls({ 
  lesson,
  className,
  onStatusChange
}: LessonStatusControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleManualPublish = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/publish`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish lesson');
      }
      
      // Notify parent component
      onStatusChange?.();
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Only show manual publish option for draft lessons with videos
  if (lesson.status !== 'draft' || !lesson.mux_asset_id) {
    return null;
  }
  
  // Check if lesson has been in draft for more than 30 minutes
  const createdAt = new Date(lesson.created_at);
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const isStuck = createdAt < thirtyMinutesAgo;
  
  if (!isStuck) {
    return null;
  }
  
  return (
    <div className={cn("mt-4 p-4 border border-amber-200 bg-amber-50 rounded-md", className)}>
      <div className="flex items-start">
        <AlertTriangleIcon className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800">Video Processing Delayed</h3>
          <p className="text-sm text-amber-700 mt-1">
            Your video appears to be taking longer than expected to process.
          </p>
          
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
          
          <Button
            variant="secondary"
            className="mt-3 bg-amber-600 text-white hover:bg-amber-700"
            onClick={handleManualPublish}
            disabled={isUpdating}
          >
            {isUpdating ? 'Publishing...' : 'Publish Manually'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 9. Create API Endpoint for Manual Publishing

```typescript
// app/api/lessons/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/services/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const lessonId = params.id;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lesson ID' },
        { status: 400 }
      );
    }
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the lesson to check ownership (RLS will handle this)
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, creator_id, mux_asset_id, mux_playback_id')
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found or permission denied' },
        { status: 404 }
      );
    }
    
    // Check if we have at least an asset ID
    if (!lesson.mux_asset_id) {
      return NextResponse.json(
        { error: 'Cannot publish lesson without a video' },
        { status: 400 }
      );
    }
    
    // If we have a temporary asset ID, we can't publish
    if (lesson.mux_asset_id.startsWith('temp_')) {
      return NextResponse.json(
        { error: 'Cannot publish lesson with temporary asset ID' },
        { status: 400 }
      );
    }
    
    // Update the lesson status to published
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);
    
    if (updateError) {
      console.error('Error updating lesson status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lesson status' },
        { status: 500 }
      );
    }
    
    // Log the manual publish
    console.log(`[MANUAL PUBLISH] Lesson ${lessonId} manually published by user ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Lesson published successfully'
    });
  } catch (error) {
    console.error('Unexpected error in publish endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Implementation Plan

1. **Database Changes**:
   - Create the `mux_asset_tracking` table with proper constraints and RLS policies
   - Create the `mux_asset_status` enum type for data integrity

2. **API Endpoints**:
   - Create `/api/mux/track-upload` endpoint with robust error handling
   - Create `/api/mux/update-asset` endpoint with transaction-like behavior
   - Create `/api/mux/check-asset-status` endpoint with improved error classification
   - Create `/api/lessons/[id]/publish` endpoint for manual publishing

3. **Code Updates**:
   - Create `useAssetStatusPolling` hook for better separation of concerns
   - Modify `useVideoUpload` hook to track lesson ID and use the polling hook
   - Update `VideoUploader` component to pass lesson ID and validate props
   - Enhance Mux service with retry logic and better error handling
   - Create `VideoProcessingStatus` component for user feedback
   - Create `LessonStatusControls` component for manual publishing

4. **Migration**:
   - Create and run a robust script to fix existing lessons with temporary IDs
   - Include proper error handling and reporting in the migration script

5. **Testing**:
   - Test the complete flow from lesson creation to publishing
   - Verify that existing lessons are properly updated
   - Test error scenarios and recovery mechanisms
   - Test the manual publishing fallback

## Testing Requirements

1. **Unit Tests**:
   - Test the new API endpoints with various input scenarios
   - Test the enhanced Mux service functions with retry logic
   - Test the new hooks with mock responses

```typescript
// tests/unit/mux-service.test.ts
describe('Mux Service', () => {
  test('getAssetStatus handles temporary asset IDs correctly', async () => {
    const result = await getAssetStatus('temp_123456');
    expect(result.status).toBe('preparing');
    expect(result.error?.type).toBe('temp_asset');
  });
  
  test('getAssetStatus handles Mux API errors gracefully', async () => {
    // Mock Mux client to throw an error
    jest.spyOn(muxClient.video.assets, 'get').mockRejectedValue(
      new Error('Asset not found')
    );
    
    const result = await getAssetStatus('real_asset_id');
    expect(result.status).toBe('errored');
    expect(result.error?.type).toBe('not_found');
  });
  
  test('withRetry retries on network errors', async () => {
    const mockFn = jest.fn();
    mockFn.mockRejectedValueOnce(new Error('network error'))
          .mockRejectedValueOnce(new Error('timeout'))
          .mockResolvedValueOnce('success');
    
    const result = await withRetry(mockFn, 3, 10);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
```

2. **Integration Tests**:
   - Test the complete lesson creation flow
   - Test the video upload and processing flow
   - Test the status update mechanism
   - Test the manual publishing fallback

```typescript
// tests/integration/lesson-status-update.test.ts
describe('Lesson Status Update Flow', () => {
  test('Lesson status updates to published after video processing', async () => {
    // Create a test lesson
    const lessonId = await createTestLesson();
    
    // Simulate video upload
    await simulateVideoUpload(lessonId);
    
    // Wait for status to update (with timeout)
    const updatedLesson = await waitForLessonStatus(lessonId, 'published', 30000);
    
    expect(updatedLesson.status).toBe('published');
    expect(updatedLesson.mux_playback_id).not.toBeNull();
    expect(updatedLesson.mux_playback_id).not.toMatch(/^temp_/);
  });
  
  test('Manual publishing works for stuck lessons', async () => {
    // Create a test lesson with old timestamp
    const lessonId = await createTestLessonWithOldTimestamp();
    
    // Simulate video upload but with a real asset ID that won't auto-publish
    await simulateVideoUploadWithRealAssetId(lessonId);
    
    // Verify lesson is still in draft status
    let lesson = await getLessonById(lessonId);
    expect(lesson.status).toBe('draft');
    
    // Trigger manual publish
    await manuallyPublishLesson(lessonId);
    
    // Verify lesson is now published
    lesson = await getLessonById(lessonId);
    expect(lesson.status).toBe('published');
  });
});
```

3. **End-to-End Tests**:
   - Create a new lesson and verify it starts in "draft" status
   - Upload a video and confirm the status changes to "published" after processing completes
   - Verify the correct Mux playback ID (not a temporary ID) is stored in the lesson record
   - Test the manual publishing fallback for stuck lessons

```typescript
// e2e/lesson-creation.spec.ts
test('Instructor can create a lesson that automatically publishes after video processing', async ({ page }) => {
  // Log in as instructor
  await loginAsInstructor(page);
  
  // Navigate to lesson creation
  await page.goto('/dashboard/lessons/new');
  
  // Fill in lesson details
  await page.fill('[name="title"]', 'Test Lesson');
  await page.fill('[name="description"]', 'This is a test lesson');
  await page.fill('[name="price"]', '9.99');
  
  // Upload video (mock the actual upload)
  await mockVideoUpload(page);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Verify lesson is created in draft status
  await expect(page.locator('[data-testid="lesson-status"]')).toHaveText('Draft');
  
  // Wait for status to change to published (with timeout)
  await expect(page.locator('[data-testid="lesson-status"]')).toHaveText('Published', { 
    timeout: 60000 
  });
  
  // Verify playback ID is not temporary
  const playbackIdElement = page.locator('[data-testid="mux-playback-id"]');
  const playbackId = await playbackIdElement.textContent();
  expect(playbackId).not.toMatch(/^temp_/);
});

test('Instructor can manually publish a stuck lesson', async ({ page }) => {
  // Create a stuck lesson via API
  const lessonId = await createStuckLesson();
  
  // Log in as instructor
  await loginAsInstructor(page);
  
  // Navigate to lesson edit page
  await page.goto(`/dashboard/lessons/${lessonId}/edit`);
  
  // Verify the manual publish control is visible
  await expect(page.locator('[data-testid="manual-publish-control"]')).toBeVisible();
  
  // Click the manual publish button
  await page.click('[data-testid="manual-publish-button"]');
  
  // Wait for success message
  await expect(page.locator('[data-testid="publish-success-message"]')).toBeVisible();
  
  // Verify lesson status is now published
  await expect(page.locator('[data-testid="lesson-status"]')).toHaveText('Published');
});
```

4. **Error Handling Tests**:
   - Test with network failures during upload
   - Test with Mux API failures
   - Test with database failures
   - Test recovery mechanisms

```typescript
// tests/error-handling/video-upload-errors.test.ts
describe('Video Upload Error Handling', () => {
  test('Handles network failure during upload', async () => {
    // Mock network failure
    mockNetworkFailure();
    
    // Attempt upload
    const { error } = await uploadVideo(testFile);
    
    // Verify error is handled properly
    expect(error).toBeDefined();
    expect(error.message).toContain('network');
  });
  
  test('Recovers from temporary Mux API failures', async () => {
    // Mock temporary API failure then success
    mockTemporaryMuxFailure();
    
    // Attempt upload
    const { success } = await uploadVideoWithRetry(testFile);
    
    // Verify recovery
    expect(success).toBe(true);
  });
  
  test('Shows appropriate error UI for failed processing', async () => {
    // Create a lesson with a video that will fail processing
    const lessonId = await createLessonWithFailingVideo();
    
    // Render the processing status component
    const { getByText } = render(<VideoProcessingStatus lessonId={lessonId} />);
    
    // Wait for error state
    await waitFor(() => {
      expect(getByText(/Video processing failed/i)).toBeInTheDocument();
    });
  });
});
```

## Additional Context

This issue affects the core functionality of the platform, as lessons remain invisible to students until published. The current implementation using temporary IDs was likely a workaround for issues with the Mux API integration, but it needs to be replaced with a more robust solution that ensures lessons are properly published once video processing is complete.

The proposed solution not only fixes the immediate issue but also adds a tracking system that will make the video processing flow more resilient and easier to debug in the future. The addition of user feedback components and fallback mechanisms ensures a better user experience even when issues occur.

## Monitoring and Observability

To ensure ongoing reliability, we've added:

1. Comprehensive error logging throughout the video processing pipeline
2. Status tracking in the database for audit and debugging
3. User-facing status indicators with appropriate feedback
4. Fallback mechanisms for edge cases
5. Exponential backoff for API retries to handle rate limiting

These improvements will make the solution more resilient, maintainable, and user-friendly while addressing the core issue of lessons not being properly published after video processing.
