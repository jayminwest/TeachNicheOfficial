# Mobile Select Menu Interaction Issues

## Description
The Select menu component in the request dialog is not functioning properly on mobile devices. The menu either fails to open or doesn't respond to touch interactions correctly. This appears to be due to positioning and touch event handling issues within the scrollable dialog content.

## To Reproduce
1. Navigate to '/requests' page
2. Click "New Request" button to open the request dialog
3. Try to interact with the Category select dropdown on a mobile device
4. Observe that the dropdown menu is either:
   - Unresponsive to touch
   - Opens but gets cut off
   - Doesn't position correctly relative to the trigger
   - May be obscured by other dialog content

## Expected Behavior
- Select dropdown should open smoothly on touch interaction
- Menu should position correctly relative to its trigger
- Menu should be fully visible and not cut off
- Touch interactions should work consistently
- Behavior should match desktop experience

## Technical Analysis

### Affected Components
1. `app/requests/components/request-dialog.tsx`
   - Contains the dialog implementation with the problematic select
   - Current implementation has scrollable content that may interfere with select positioning

2. `app/components/ui/select.tsx`
   - Core select component implementation
   - Uses Radix UI primitives
   - May need improved touch handling and positioning logic

3. `app/components/ui/dialog.tsx`
   - Dialog component that contains the select
   - Current max-height and overflow settings may affect select menu positioning

### Root Cause
The issue stems from:
1. Conflict between dialog's scrollable content and select menu positioning
2. Potential z-index stacking context issues
3. Possible touch event handling limitations

### Code Issues
```typescript
// In request-dialog.tsx
<DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-hidden">
  <div className="flex-1 overflow-y-auto pt-2 pb-4 px-1">
    // Select component inside scrollable container
  </div>
</DialogContent>

// In select.tsx
<SelectPrimitive.Content
  position="popper"
  // Current positioning may not account for scrollable container
>
```

## Environment
- **OS**: iOS and Android (mobile devices)
- **Browser**: Mobile Safari, Chrome Mobile
- **Version**: Latest versions
- **Screen sizes**: Various mobile viewport sizes

## Files Needing Updates

1. `app/requests/components/request-dialog.tsx`
   - Adjust dialog content structure
   - Improve select component positioning
   - Update overflow handling

2. `app/components/ui/select.tsx`
   - Enhance mobile touch handling
   - Improve positioning logic
   - Update z-index management

3. `app/components/ui/dialog.tsx`
   - Review and potentially update stacking context
   - Adjust overflow handling

4. `app/__tests__/utils/test-utils.tsx`
   - Add mobile-specific test cases
   - Include touch interaction testing

## Testing Requirements
- Add specific mobile device viewport tests
- Test touch interactions
- Verify positioning across different screen sizes
- Ensure scrolling behavior works correctly
- Validate z-index stacking

## Additional Context
- Issue appears to be specific to mobile devices
- Desktop functionality works as expected
- Problem is more pronounced on smaller viewport sizes
- May need to consider different positioning strategy for mobile vs desktop
# Feature: Live Sessions with Players

## Description
Implement a new feature allowing users to book live, one-on-one sessions with kendama players. These sessions will be 15-30 minutes in length, can be either free or paid (at the player's discretion), and will be conducted via video call. All session recordings should be stored using our third-party video API, with payments processed through our existing Stripe integration.

## User Stories
- As a kendama enthusiast, I want to book a live session with my favorite player to get personalized feedback on my technique
- As a kendama player/creator, I want to offer paid live sessions to my followers as an additional revenue stream
- As a kendama player/creator, I want to offer free sessions to build my community
- As a platform administrator, I want all sessions to be recorded and stored for quality assurance and content reuse (with permission)

## Technical Requirements

### Booking System
- Calendar integration for players to set their availability
- Booking interface for users to select available time slots
- Email notifications for booking confirmations and reminders
- Ability to reschedule or cancel sessions with appropriate policies

### Video Integration
- Integration with our existing third-party video API for live sessions
- Automatic recording of sessions (with consent from both parties)
- Secure storage of recorded sessions
- Option for players to download or share recordings

### Payment Processing
- Utilize existing Stripe integration for processing payments
- Allow players to set their own session rates
- Implement platform fee structure (percentage-based)
- Handle refunds for cancellations according to policy

### User Interface
- Session discovery page for browsing available players
- Player profiles showing session offerings and availability
- Booking management dashboard for users
- Session management dashboard for players

## Affected Components
- User profiles (to add session offerings)
- Payment system (to handle session payments)
- Video system (to handle live sessions and recordings)
- Notification system (for booking alerts)
- Dashboard (for session management)

## Database Changes
New tables required:
- `sessions` - Store session details, status, participants
- `session_availability` - Store player availability windows
- `session_recordings` - Store links to recorded sessions

Updates to existing tables:
- `profiles` - Add fields for session preferences, rates, etc.

## API Endpoints
New endpoints needed:
- `GET /api/sessions` - List available sessions
- `POST /api/sessions` - Create a new session booking
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session (reschedule, cancel)
- `GET /api/users/:id/availability` - Get user's available time slots
- `POST /api/sessions/:id/join` - Join a session
- `GET /api/sessions/:id/recording` - Access session recording

## Testing Requirements
- Unit tests for session booking logic
- Integration tests for payment processing
- E2E tests for the booking flow
- Performance testing for concurrent sessions

## Security Considerations
- Ensure only authorized users can access session recordings
- Implement secure video call links
- Protect payment information
- Verify identity of players offering sessions

## Accessibility Requirements
- Ensure booking interface is screen-reader friendly
- Provide captions for recorded sessions when possible
- Ensure color contrast meets WCAG standards

## Rollout Plan
1. Develop and test the feature in staging
2. Beta test with a small group of players and users
3. Gather feedback and make adjustments
4. Full rollout with marketing campaign

## Additional Context
This feature aligns with our platform's goal of connecting kendama enthusiasts with players and creating more interactive learning opportunities. It also provides an additional revenue stream for both players and the platform.
