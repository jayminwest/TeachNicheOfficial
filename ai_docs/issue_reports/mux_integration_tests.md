# Mux Video Integration Tests Implementation

## Required Changes

### 1. Update jest.setup.ts
Add Mux-specific mocks and session storage mock for testing video components and lesson access.

Changes needed:
- Add @mux/mux-player-react mock
- Add @mux/mux-uploader-react mock
- Add session storage mock
- Add new icon mocks (AlertCircle, CheckCircle2, Upload, Loader2)

### 2. Create New Test Files

The following test files need to be created:

#### app/__tests__/hooks/use-lesson-access.test.tsx
Test the lesson access hook including:
- Cache validation (5 minute duration)
- Retry logic (3 attempts)
- Timeout handling (5 seconds)
- Purchase status verification
- Error state management

#### app/__tests__/components/ui/lesson-access-gate.test.tsx
Test the access gate component including:
- Loading states
- Error handling
- Purchase flow integration
- Conditional rendering based on access

#### app/__tests__/components/ui/video-uploader.test.tsx
Test the upload functionality including:
- Dynamic endpoint URL fetching
- Upload progress tracking
- Status transitions
- File validation
- Error handling

#### app/__tests__/components/ui/video-player.test.tsx
Test the video player including:
- JWT token generation for protected content
- Free vs paid content handling
- MuxPlayer integration
- Access control integration

### 3. Add Test Utilities to app/__tests__/utils/test-utils.tsx
Add helper functions for:
- Mock file creation
- Auth context rendering
- Mux component testing

## Implementation Order

1. First update jest.setup.ts with Mux mocks
2. Add test utilities to test-utils.tsx
3. Create use-lesson-access tests
4. Create component test files
5. Run test suite to verify coverage

## Required Dependencies

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event jest-environment-jsdom jest-fetch-mock
```

## Test Commands

```bash
# Run specific test suites
npm test -- use-lesson-access.test.tsx
npm test -- lesson-access-gate.test.tsx
npm test -- video-uploader.test.tsx
npm test -- video-player.test.tsx
```

## Notes
- All tests must verify purchase-based access control
- Include error handling scenarios
- Test timeout and retry logic
- Verify cleanup processes
