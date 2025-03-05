# Issue: Fix Video Playback System - Eliminate Temporary IDs in Database

## Description

The video upload and playback system is currently storing temporary placeholder IDs (e.g., `temp_playback_lDXdeCIa4cAOwqXF76u2PzTTsVi85ua9Z6SLVRYRziA`) in the database instead of actual Mux playback IDs. This is causing video playback to fail with errors like:

```
app/components/ui/video-player.tsx (48:17) @ VideoPlayer.useEffect
  46 |       .then(res => {
  47 |         if (!res.ok) {
> 48 |           throw new Error(`HTTP error! Status: ${res.status}`);
     |                 ^
  49 |         }
  50 |         return res.json();
  51 |       })
```

While the upload process appears to be working correctly and videos are successfully uploaded to Mux, there's a disconnect in the communication flow that's causing temporary IDs to be stored in the database instead of the actual Mux playback IDs.

## Technical Analysis

After reviewing the code, I've identified several specific issues in the Mux integration:

### CRITICAL ISSUE: TEMPORARY IDs SHOULD NEVER BE CREATED OR STORED

The current implementation creates temporary IDs as fallbacks in multiple places:

1. In `app/services/mux.ts` - `getAssetIdFromUpload` function:
   ```typescript
   // If we've exhausted all attempts, create a temporary asset ID
   console.log(`Creating temporary asset ID after exhausting attempts for ${uploadId}`);
   return `temp_${uploadId.substring(0, 20)}`;
   ```

2. In `app/api/mux/wait-for-asset/route.ts`:
   ```typescript
   // For temporary IDs, just return a ready status with a dummy playback ID
   return NextResponse.json({
     status: 'ready',
     playbackId: `dummy_${assetId.substring(5)}`
   });
   ```

3. In `app/api/mux/asset-from-upload/route.ts`:
   ```typescript
   const fallbackAssetId = `temp_${shortId}`;
   console.log(`API: Using fallback asset ID ${fallbackAssetId}`);
   return NextResponse.json({ assetId: fallbackAssetId });
   ```

These temporary IDs are then being stored in the database and used for video playback, which fails because they don't correspond to actual Mux assets.

### Additional Issues

1. **Mux Client Initialization Issues**: The Mux client initialization has multiple fallback paths that can lead to silent failures.

2. **Error Handling Strategy**: The current approach creates temporary IDs as fallbacks, but doesn't distinguish them from real IDs when storing in the database.

3. **Asynchronous Timing Issues**: The system may be updating the database before Mux has finished processing the video.

## Root Causes

1. **Environment Variables**: It's possible the Mux API credentials are not properly set in the environment, causing API calls to fail.

2. **Fallback Strategy**: The current approach of creating temporary IDs as fallbacks is fundamentally flawed - we should NEVER create temporary values.

3. **Error Propagation**: Errors are being caught and replaced with temporary values instead of being properly propagated and handled.

## Proposed Solution

### Core Principle: NEVER CREATE TEMPORARY VALUES

The solution must follow this core principle: **We should NEVER create temporary values throughout this process**. Instead:

1. **Fail Fast and Explicitly**: If we can't get a real Mux ID, we should fail with a clear error message.
2. **Don't Store Invalid Data**: Never store temporary or dummy IDs in the database.
3. **Proper Error Handling**: Show users meaningful error messages instead of silently failing.

### Specific Changes Needed

1. **Fix Mux Client Initialization**:
   - Ensure proper error propagation
   - Validate credentials before proceeding
   - Don't silently fall back to temporary values

2. **Remove All Temporary ID Creation**:
   - Remove all code that creates `temp_` or `dummy_` IDs
   - Replace with proper error handling

3. **Improve Error Handling**:
   - Show clear error messages to users
   - Log detailed errors for debugging
   - Don't catch errors just to create temporary values

4. **Add Validation Before Database Updates**:
   - Validate that IDs are real Mux IDs before storing
   - Never store IDs that start with `temp_`, `dummy_`, or `local_`

5. **Simplify the Flow**:
   - Reduce the number of API calls and fallback paths
   - Make the flow more linear and predictable

## Files to Update

1. `app/services/mux.ts` - Remove temporary ID creation, fix client initialization
2. `app/api/mux/wait-for-asset/route.ts` - Remove dummy ID creation
3. `app/api/mux/asset-from-upload/route.ts` - Remove fallback ID creation
4. `app/hooks/use-video-upload.ts` - Improve upload success handling
5. `app/components/ui/video-player.tsx` - Add better error handling for invalid playback IDs

## Testing Requirements

1. Verify Mux API credentials are correctly set in the environment
2. Test video upload with various file sizes and formats
3. Verify only valid Mux IDs are stored in the database
4. Confirm videos play correctly after upload
5. Test error scenarios (network issues, invalid files)
6. Verify the system properly handles Mux API failures without storing invalid data

## Additional Context

The current implementation has many fallback mechanisms that were likely added during development to handle edge cases. While well-intentioned, these are now causing issues by allowing invalid data to be stored in the database.

For the initial fix, we should focus on simplifying the flow to ensure it works reliably for the common case, then add back more sophisticated error handling as needed.

## Priority

High - This issue is blocking core functionality of the platform (video playback).
