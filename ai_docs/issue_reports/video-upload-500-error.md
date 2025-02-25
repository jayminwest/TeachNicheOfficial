# Fix: Video Upload Fails with 500 Server Error

## Description
When attempting to upload a new video, the upload process fails with a 500 server error. The client-side console shows an error related to retrieving the asset ID from the upload.

## To Reproduce
1. Navigate to the video upload interface
2. Select a video file for upload
3. Initiate the upload process
4. Observe the upload fails with a 500 server error

## Expected Behavior
The video should upload successfully, and the system should return a valid asset ID that can be used for further processing or display.

## Technical Analysis
The error occurs in the client-side JavaScript when attempting to retrieve the asset ID after the upload. The server is responding with a 500 error, indicating a server-side issue rather than a client validation problem.

### Error Details
```
Failed to load resource: the server responded with a status of 500 ()
Error getting asset ID from upload: Error: Failed to get asset status
    at ta.V (page-14a43cc8d6e50375.js:1:14359)
```

This suggests that while the initial upload request might be processed, the subsequent request to get the asset status is failing on the server side.

## Affected Files
The issue likely involves these components:

1. `app/components/ui/video-uploader.tsx` - Client-side component handling the upload UI and initial request
2. `app/services/mux.ts` - Service handling Mux video integration
3. `app/api/video/` endpoints - Server-side API routes handling video uploads and status checks

## Potential Causes
1. Server-side error in processing the uploaded video
2. Incorrect or expired API credentials for the Mux service
3. Malformed request when checking asset status
4. Rate limiting or quota issues with the Mux API
5. Network or infrastructure issues between our server and Mux

## Suggested Investigation Steps
1. Check server logs for detailed error messages at the time of the 500 response
2. Verify Mux API credentials are valid and not expired
3. Examine the network requests in browser dev tools to see the exact request/response cycle
4. Test with a smaller video file to rule out size-related issues
5. Check if the issue occurs in all environments (development, staging, production)

## Testing Requirements
- Test with various video file formats (MP4, MOV, etc.)
- Test with different file sizes
- Verify behavior across different browsers
- Check both authenticated and unauthenticated states (if applicable)

## Environment
- Browser: [Browser information where the error was observed]
- OS: [Operating system information]
- Device: [Device information if relevant]
- App Version: [Current application version]

## Additional Context
This appears to be a regression as video uploads were previously working. Recent changes to the video upload flow or Mux integration might have introduced this issue.

## Labels
- bug
- high-priority

## Assignee
@me
