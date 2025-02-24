# Video Uploader Error Report

## Issue Description
The VideoUploader component is throwing a generic "Failed to get upload URL" error without providing sufficient context about the underlying cause.

## Error Details
```
Error: Failed to get upload URL
Location: app/components/ui/video-uploader.tsx (73:13)
Component: VideoUploader.useCallback[getUploadUrl]
```

## Technical Analysis
1. The current error handling is too generic and doesn't provide enough information for debugging
2. No HTTP status code or response details are included in the error
3. No retry mechanism is implemented
4. Error doesn't propagate useful information from the server response

## Proposed Solutions
1. Enhance error message with HTTP status code and response details
2. Add retry mechanism for transient failures
3. Parse and include server error messages when available
4. Add detailed logging for debugging purposes

## Implementation Plan
1. Modify getUploadUrl to include response details in error message
2. Add retry logic for 5xx errors
3. Improve error handling to parse server error messages
4. Add debug logging throughout the upload process

## Testing Requirements
- Test various HTTP error scenarios
- Verify retry mechanism works as expected
- Confirm error messages are helpful for debugging
- Validate logging provides necessary debug information
