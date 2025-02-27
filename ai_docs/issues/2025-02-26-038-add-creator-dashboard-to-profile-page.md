# Add Creator Dashboard to Profile Page

## Issue Overview

**Issue Number:** 038  
**Date:** 2025-02-26  
**Type:** Enhancement  
**Priority:** Medium  
**Estimated Effort:** 4 hours  

## Description

The Profile page currently lacks integration with the Creator Dashboard functionality. We need to enhance the Profile page to include a Creator Dashboard section that redirects authorized creators to the /dashboard/ page. For users who are not yet creators, we should display a dialog explaining how to become a creator.

## User Stories

**As a creator:**
- I want to easily access my Creator Dashboard from my profile page
- I want a clear visual indication that I have creator privileges

**As a non-creator user:**
- I want to understand how to become a creator
- I want to learn about the benefits of becoming a creator
- I want a simple process to apply for creator status

## Technical Requirements

1. Add a Creator Dashboard section to the Profile page
2. Implement conditional rendering based on user creator status:
   - For creators: Show dashboard access button/link
   - For non-creators: Show "Become a Creator" button that opens an informational dialog
3. Create a dialog component explaining:
   - Creator program benefits
   - Requirements to become a creator
   - Application process
   - Expected timeline
4. Add navigation to the dashboard for authorized creators
5. Ensure proper authentication checks before dashboard access

## Implementation Details

### Auth Context Changes
- Utilize existing auth context to check if user has creator status
- No new API endpoints needed, use existing user role/status data

### UI Components
- Create a new section in the profile page layout
- Implement a new dialog component for non-creators
- Design clear visual distinction between creator/non-creator states

### Navigation
- Implement programmatic navigation to /dashboard/ route
- Ensure proper state persistence during navigation

## Affected Files

Primary:
- `app/profile/components/profile-form.tsx` - Add creator dashboard section
- New file: `app/components/ui/creator-info-dialog.tsx` - Dialog explaining creator program

Secondary:
- `app/services/auth/AuthContext.tsx` - May need helper method to check creator status

## Testing Requirements

- Unit tests:
  - Test conditional rendering based on creator status
  - Test dialog component functionality
  
- Integration tests:
  - Verify correct display for creators vs. non-creators
  - Test dialog open/close functionality
  - Ensure proper navigation to dashboard
  
- E2E tests:
  - Complete user journey from profile to dashboard for creators
  - Dialog interaction and information display for non-creators

## Acceptance Criteria

1. Creator users see a clearly labeled section to access their dashboard
2. Non-creator users see information about becoming a creator
3. Dialog provides comprehensive information about the creator program
4. Navigation to dashboard works correctly for authorized users
5. UI is consistent with existing design patterns
6. All tests pass

## Additional Context

This enhancement supports our goal of increasing creator engagement and providing clear pathways for users to become creators. The dialog should emphasize the benefits of becoming a creator, including the revenue sharing model (85% to creators).

## Related Issues

- #025 Creator Dashboard Implementation
- #031 Creator Onboarding Process
