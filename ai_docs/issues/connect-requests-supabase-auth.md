# Issue: Connect Requests Page to Supabase with Authentication Requirements

## Description
The requests page needs proper integration with Supabase and implementation of Row Level Security (RLS) policies to ensure only authenticated users can create and vote on lesson requests. While basic integration exists, we need to enhance authentication checks and implement proper database security.

## Technical Analysis
Current implementation has:
- Basic Supabase integration for fetching requests
- Initial voting functionality in RequestCard
- Form validation for request creation

Missing components:
1. Proper RLS policies in Supabase for the `lesson_requests` and `lesson_request_votes` tables
2. Consistent authentication checks across all request operations
3. Optimized error handling for authentication failures
4. Improved state management after voting actions
5. TypeScript types for request operations and responses
6. Client-side authentication guards
7. Comprehensive testing strategy
8. Enhanced user experience for authentication flows
9. Database transactions for complex operations
10. Rate limiting to prevent abuse

## Reproduction Steps
1. Navigate to `/requests` page
2. Attempt to create a new lesson request while logged out
3. Try to vote on an existing request while logged out
4. Create a request while logged in
5. Vote on a request while logged in
6. Try to vote on the same request twice
7. Test with expired authentication tokens
8. Test rapid voting to check rate limiting

## Expected Behavior
- Unauthenticated users can view requests but are prompted to sign in when attempting to create/vote
- Authenticated users can create new requests and vote on existing ones
- Users cannot vote multiple times on the same request
- Clear feedback is provided for all actions
- Database security prevents unauthorized operations
- Rate limiting prevents abuse of the system
- Graceful handling of authentication token expiration
- Optimistic UI updates with proper error recovery

## Current Behavior
- Basic authentication checks exist but are inconsistent
- No RLS policies to prevent direct database access
- Error handling needs improvement for authentication failures
- Vote state management has potential race conditions
- No type safety for request operations
- Missing client-side authentication guards
- No rate limiting implementation

## Affected Files
- `app/lib/supabase/requests.ts` - Needs RLS-aware error handling
- `app/requests/components/request-card.tsx` - Needs improved vote state management
- `app/requests/components/request-grid.tsx` - Needs better error handling
- `app/hooks/use-auth-guard.ts` - New file for authentication guards
- `app/types/request.ts` - New file for request type definitions
- Supabase migration files (to be created) for RLS policies

## Implementation Requirements

### TypeScript Types
- Create dedicated types for request operations:
  ```typescript
  export interface RequestVoteResponse {
    success: boolean;
    currentVotes: number;
    userHasVoted: boolean;
    error?: RequestVoteError;
  }
  
  export type RequestVoteError = 
    | 'unauthenticated' 
    | 'already_voted' 
    | 'database_error'
    | 'rate_limited';
  ```

### Client-Side Authentication Guards
- Implement a `useAuthGuard` hook to protect request operations
- Pre-check authentication before attempting database operations
- Integrate with existing authentication system

### Supabase RLS Policies
Create the following RLS policies:
1. For `lesson_requests` table:
   - Allow anyone to read requests
   - Allow only authenticated users to insert new requests
   - Allow users to update/delete only their own requests
   - Add rate limiting for request creation (max 5 per hour)

2. For `lesson_request_votes` table:
   - Allow anyone to read votes (for counting)
   - Allow only authenticated users to insert votes
   - Prevent duplicate votes from the same user
   - Allow users to delete only their own votes
   - Add rate limiting for voting (max 20 per hour)

### Error Handling Improvements
- Add specific error handling for authentication failures
- Provide clear user feedback for permission issues
- Handle Supabase JWT validation errors gracefully
- Implement retry mechanisms for transient errors
- Add proper session refresh when tokens expire

### Vote State Management
- Implement optimistic UI updates for votes
- Add proper concurrency handling with database transactions
- Ensure vote counts stay in sync with database
- Add CSRF protection for vote operations

## Testing Requirements
- Test all request operations when authenticated and unauthenticated
- Verify RLS policies prevent unauthorized operations
- Test error handling for various failure scenarios
- Verify vote counts update correctly
- Add Playwright end-to-end tests for authentication flows
- Test edge cases like token expiration during operations
- Test rate limiting functionality
- Verify optimistic UI updates work correctly
- Test performance with large numbers of requests

## User Experience Enhancements
- Add a "Sign In to Vote" component for unauthenticated users
- Implement toast notifications for authentication-related actions
- Add loading states during authentication checks
- Implement caching for frequently accessed requests
- Add pagination or infinite scroll for large request lists

## Security Considerations
- Implement CSRF protection for all request operations
- Add proper input sanitization for request content
- Add logging for security-related events
- Ensure proper error messages that don't leak sensitive information

## Documentation
- Add comprehensive documentation for the authentication flow
- Document the RLS policies for future reference
- Create a troubleshooting guide for common authentication issues

## Additional Context
This feature is critical for community engagement, allowing users to request lessons they want to see. Proper authentication and security are essential to prevent spam and ensure quality content requests.

## Environment
- Development environment
- Affects all browsers and devices

## Command to Create Issue
```bash
gh issue create --title "Fix: Connect Requests Page to Supabase with Authentication Requirements" --body-file issue-description.md --label "enhancement,security" --assignee "@me"
```
