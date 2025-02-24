# Add HEIC Video Support Investigation

## Description
We need to investigate and potentially add support for HEIC video files in our VideoUploader component to improve compatibility with iOS devices. This requires both technical investigation and implementation planning.

## Current State
The VideoUploader currently accepts:
```typescript
acceptedTypes = ['video/mp4', 'video/quicktime']
```

## Technical Investigation Required

### 1. Mux Platform Compatibility
- Verify if Mux supports HEIC video ingestion
- Document any Mux-specific requirements or limitations
- Check if format conversion is needed before upload

### 2. Client-Side Requirements
- Investigate browser support for HEIC format
- Research client-side conversion libraries if needed
- Evaluate performance implications

### 3. Implementation Dependencies
- Check @mux/mux-uploader-react version compatibility
- Identify any additional packages needed
- Review API endpoint modifications required

## Files Requiring Analysis
1. `app/components/ui/video-uploader.tsx`
2. `app/services/mux.ts`
3. Mux upload API route
4. Type definitions for Mux integration

## Questions to Answer
1. Does Mux natively support HEIC video ingestion?
2. Should we handle format conversion client-side or server-side?
3. What are the performance implications of HEIC support?
4. Do we need to modify our error handling for HEIC-specific cases?

## Next Steps
1. Technical investigation of Mux HEIC support
2. Browser compatibility research
3. Prototype implementation approach
4. Update issue with findings and specific implementation plan

## Labels
- investigation
- enhancement
- help wanted

## Notes
- HEIC (High Efficiency Image Container) is Apple's preferred format
- Implementation approach will depend on Mux platform capabilities
- May require client-side conversion solution
- Need to maintain current upload performance standards

## Updates
This issue will be updated with findings from the technical investigation to inform the implementation approach.
