# Issue Report: Request Voting Mechanism Failing with Database Error in Production

## Issue Description

The voting mechanism on the requests page is failing in the production environment with a database error. When users attempt to upvote a request, the API returns a 500 error with a "database_error" message. This issue is only occurring in the production environment and cannot be reproduced locally.

### Error Messages
```
Starting vote process for request: f02fdd01-a783-4041-90fc-67dcc9388eb0 type: upvote

Failed to load resource: the server responded with a status of 500 ()

Vote request failed: Object
result: 
  currentVotes: 0
  error: "database_error"
  success: false
  userHasVoted: false
status: 500
statusText: ""
```

### Technical Analysis

After reviewing the code, I've identified a critical issue: the client-side code in `voteOnRequest()` function is making a request to `/api/requests/vote`, but there's no corresponding API route at that path. Instead, there's an API route at `/api/votes/route.ts`.

The issue flow appears to be:

1. User clicks the vote button in `request-card.tsx`
2. This calls `handleVote()` which calls `voteOnRequest()` from `/app/lib/supabase/requests.ts`
3. `voteOnRequest()` makes a fetch request to `/api/requests/vote`
4. This endpoint doesn't exist, causing a 500 error
5. The error is caught and returned as a structured response with `success: false` and `error: "database_error"`

This explains why it works in development but fails in production - development environments often have more lenient routing or different error handling that might mask this issue.

## Reproduction Steps

The issue cannot be reproduced locally, but in production:

1. Navigate to the requests page
2. Attempt to upvote a request (specifically request ID: f02fdd01-a783-4041-90fc-67dcc9388eb0)
3. Observe the 500 error in the network tab
4. Note the response contains `error: "database_error"` and `success: false`

## Expected Behavior

When a user votes on a request:
1. The vote should be recorded in the database
2. The API should return a successful response with updated vote count
3. The UI should update to reflect the new vote count and the user's vote status

## Environment Details

- Environment: Production only (cannot reproduce locally)
- Browser: All browsers (appears to be a server-side issue)
- Request ID: f02fdd01-a783-4041-90fc-67dcc9388eb0
- Endpoint: `/api/requests/vote` (which doesn't exist)

## Affected Files

1. Client-side voting function:
   - `/app/lib/supabase/requests.ts` - The `voteOnRequest()` function is making a request to an incorrect endpoint

2. API route handling votes:
   - `/app/api/votes/route.ts` - This is the actual API route for votes, but it's not being called

3. Client-side voting component:
   - `/app/requests/components/request-card.tsx` - Uses the `voteOnRequest()` function

## Proposed Solution

There are two possible solutions:

1. **Create the missing API route**:
   Create a new file at `/app/api/requests/vote/route.ts` that handles vote operations, similar to the existing `/app/api/votes/route.ts`.

2. **Update the client-side code** (preferred):
   Modify the `voteOnRequest()` function in `/app/lib/supabase/requests.ts` to use the correct API endpoint:

```typescript
// In /app/lib/supabase/requests.ts
export async function voteOnRequest(requestId: string, voteType: 'upvote' | 'downvote'): Promise<RequestVoteResponse> {
  // ...existing code...
  
  try {
    // Change this line from:
    // const response = await fetch('/api/requests/vote', {
    // To:
    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '1',
      },
      credentials: 'include',
      body: JSON.stringify({ requestId, voteType }),
    })
    
    // ...rest of the function...
  }
}
```

## Additional Context

The database schema shows that the `lesson_request_votes` table has the following structure:
- `id` (uuid, primary key)
- `request_id` (uuid, foreign key to lesson_requests)
- `user_id` (uuid, foreign key to users/profiles)
- `vote_type` (text)
- `created_at` (timestamp with time zone)

The issue is not with the database schema itself, but with the API endpoint mismatch.

## Testing Requirements

After implementing the fix:
1. Verify voting works in production for multiple users
2. Ensure vote counts are accurately reflected in the UI
3. Check that users can change their votes (if that's a supported feature)
4. Verify that the database is correctly updated with vote records

## Priority

This issue should be considered high priority as it affects a core user interaction feature in the production environment.
