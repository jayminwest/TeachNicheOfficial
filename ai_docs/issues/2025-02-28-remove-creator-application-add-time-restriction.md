# Remove Creator Application Process and Add 48-Hour Restriction

## Description

This issue addresses the need to simplify our onboarding process by removing the creator application system and replacing it with an automatic time-based restriction.

## Changes Required

1. Remove the creator application form and related components
2. Implement a 48-hour waiting period for new accounts before they can create lessons
3. Add a user-friendly message explaining the restriction
4. Update any navigation or UI elements that reference the creator application process

## Technical Implementation

### New Files
- `app/services/user-restrictions.ts` - Service to check if a user meets the time requirement
- `app/components/ui/lesson-creation-restriction.tsx` - Component to display the restriction message

### Files to Remove
- `app/creator-application/components/application-form.tsx`
- Any API routes related to creator applications
- Any pages related to creator applications

### Files to Modify
- Any lesson creation forms/pages to check the user's account age
- Navigation components that reference creator applications

## Security Considerations

- The 48-hour restriction helps prevent spam and abuse by requiring accounts to "age" before creating content
- This approach is more scalable than manual review and still provides basic protection

## Testing Requirements

- Verify that new users cannot create lessons within 48 hours of registration
- Verify that users who have accounts older than 48 hours can create lessons
- Verify that the restriction message displays correctly with accurate time remaining
- Verify that the restriction is enforced on both client and server sides

## User Experience

- Users should see a clear, friendly message explaining why they cannot immediately create lessons
- The message should include the time remaining until they can create lessons
- The restriction should be presented as a security measure, not a punishment

## Related Issues

None

## Assignees

@dev-team

## Priority

High

## Labels

enhancement, security, user-experience
