# Issue Report: Implement Comprehensive Unit Tests for Request Creation and Voting

## Issue Description

Our lesson request creation and voting functionality lacks comprehensive unit test coverage. This is a critical user flow that needs proper testing to ensure reliability and prevent regressions as we continue development.

Currently, we have basic tests for the request creation API route and voting functionality, but they don't cover all edge cases, error scenarios, and user flows. Without proper test coverage, we risk introducing bugs when making changes to these components, potentially affecting user experience in a core feature of our platform.

## Technical Analysis

The request creation and voting system involves multiple components:

1. **API Routes**:
   - `app/api/requests/route.ts` - Handles creation and retrieval of lesson requests
   - `app/api/votes/route.ts` - Manages vote retrieval
   - `app/api/requests/vote/route.ts` - Handles vote creation and updates

2. **Validation**:
   - `app/lib/schemas/lesson-request.ts` - Contains Zod schemas for validating request and vote data

3. **Database Interactions**:
   - `app/lib/supabase/server.ts` - Creates Supabase client for server-side operations

4. **Types**:
   - `app/types/request.ts` - Contains request and vote-related type definitions
   - `app/types/lesson.ts` - Contains lesson request status types

5. **Existing Tests**:
   - `app/api/__tests__/requests.test.ts` - Basic tests for request creation
   - `app/api/__tests__/vote.test.ts` - Basic tests for voting functionality

The current tests don't adequately cover:
- Authentication edge cases
- Validation error scenarios
- Database error handling
- Vote toggling behavior
- Request filtering and sorting
- Vote counting accuracy

## Expected Behavior

A comprehensive test suite should verify:

### For Request Creation (`app/api/requests/route.ts`):
- Successful request creation with valid data
- Rejection of invalid request data (missing fields, invalid formats)
- Authentication requirements (unauthenticated users cannot create requests)
- Error handling for database failures
- Proper filtering of requests by category and status
- Sorting of requests by creation date and vote count

### For Vote Management (`app/api/votes/route.ts` and `app/api/requests/vote/route.ts`):
- Successful vote creation
- Vote toggling (voting again removes the vote)
- Authentication requirements (unauthenticated users cannot vote)
- Prevention of duplicate votes
- Proper vote counting
- Error handling for database failures
- Proper response format matching `RequestVoteResponse` type

## Files That Need Additional Tests

1. **API Routes**:
   - `app/api/requests/route.ts` - Needs more comprehensive tests for GET and POST methods
   - `app/api/votes/route.ts` - Needs tests for GET method
   - `app/api/requests/vote/route.ts` - Needs more comprehensive tests for POST method

2. **Test Files to Create/Enhance**:
   - `app/api/__tests__/requests.test.ts` - Enhance with more test cases
   - `app/api/__tests__/vote.test.ts` - Enhance with more test cases
   - `app/api/__tests__/votes.test.ts` - Create new test file for the votes GET endpoint

## Proposed Solution

### 1. Enhance Request API Tests

Expand `app/api/__tests__/requests.test.ts` to include:

```typescript
// Additional test cases to implement
it('rejects requests with missing required fields', async () => {
  // Test with missing title, description, etc.
})

it('handles database errors gracefully', async () => {
  // Mock database error and verify error response
})

it('filters requests by category correctly', async () => {
  // Test GET with category parameter
})

it('filters requests by status correctly', async () => {
  // Test GET with status parameter
})

it('returns requests sorted by creation date', async () => {
  // Verify sorting order
})
```

### 2. Enhance Vote API Tests

Expand `app/api/__tests__/vote.test.ts` to include:

```typescript
// Additional test cases to implement
it('toggles vote when user votes twice', async () => {
  // Test vote removal on second vote
})

it('handles database errors during vote creation', async () => {
  // Mock database error and verify error response
})

it('updates vote count correctly', async () => {
  // Verify vote count is updated
})

it('prevents voting with invalid request ID', async () => {
  // Test with invalid UUID
})
```

### 3. Create Tests for Votes GET Endpoint

Create `app/api/__tests__/votes.test.ts` to test the GET method in `app/api/votes/route.ts`:

```typescript
// Test cases to implement
it('retrieves vote for valid request and user IDs', async () => {
  // Test successful vote retrieval
})

it('returns null for non-existent vote', async () => {
  // Test when no vote exists
})

it('requires request ID parameter', async () => {
  // Test missing requestId parameter
})

it('requires user ID parameter', async () => {
  // Test missing userId parameter
})

it('handles database errors gracefully', async () => {
  // Mock database error and verify error response
})
```

### 4. Improve Mocking Approach

Use the existing mock utilities more effectively:

```typescript
// Example of improved mocking
const mockSupabase = createMockSupabaseClient({
  shouldSucceed: false,
  errorMessage: 'Database connection error'
});

(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
```

## Testing Requirements

The implemented tests should:

1. **Run in isolation** without external dependencies
2. **Use consistent mocking patterns** from `__mocks__/services/supabase.ts` and `__mocks__/utils/mock-helpers.ts`
3. **Cover both success and error scenarios**
4. **Test edge cases** (e.g., malformed requests, database errors)
5. **Be maintainable and readable**
6. **Follow our established testing patterns**
7. **Achieve at least 80% code coverage** for the request and voting functionality

## Implementation Steps

1. **Review existing tests** to understand current patterns and coverage
2. **Enhance request creation tests** in `app/api/__tests__/requests.test.ts`
3. **Enhance vote creation tests** in `app/api/__tests__/vote.test.ts`
4. **Create vote retrieval tests** in a new file `app/api/__tests__/votes.test.ts`
5. **Run tests and verify coverage**
6. **Document any gaps or issues** found during testing

## Additional Context

According to our documentation in `ai_docs/core/OVERVIEW.md`, we follow a test-driven development approach with an emphasis on "Testing First" and "Complete Test Coverage". These tests should align with that philosophy.

The tests should use the `DatabaseResponse<T>` pattern for consistent error handling as mentioned in our `ai_docs/core/GLOSSARY.md`.

## Related Files

- `app/api/requests/route.ts`
- `app/api/votes/route.ts`
- `app/api/requests/vote/route.ts`
- `app/lib/schemas/lesson-request.ts`
- `app/lib/supabase/server.ts`
- `app/types/request.ts`
- `app/types/lesson.ts`
- `app/api/__tests__/requests.test.ts`
- `app/api/__tests__/vote.test.ts`
- `__mocks__/services/supabase.ts`
- `__mocks__/utils/mock-helpers.ts`

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-07 | Development Team | Initial issue report |
