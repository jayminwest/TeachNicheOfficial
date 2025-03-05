# Issue Report: Refine Lesson Page and Purchase Flow

## Description

The current lesson page and purchase flow have several inconsistencies and UX issues that need to be addressed. The main problems include:

1. Inconsistent behavior when clicking on lesson cards
2. Authentication issues during the purchase process
3. Lack of proper button state changes based on user relationship to the lesson (purchaser or creator)
4. Incorrect navigation flow from lesson cards to checkout

## Technical Analysis

The issue involves multiple components and user flows that need to be refined:

1. **Lesson Card Interaction**:
   - Clicking the card should open a lesson preview dialog
   - The "Purchase Lesson" button should navigate directly to Stripe checkout

2. **Authentication Handling**:
   - Authentication checks are inconsistent throughout the purchase flow
   - Need to implement proper auth gates at each step of the process

3. **Dynamic Button States**:
   - For purchased lessons: "Purchase Lesson" → "Access Lesson" (with different styling)
   - For creator-owned lessons: "Purchase Lesson" → "Edit Lesson"

4. **Purchase Confirmation**:
   - Need to properly check the `purchases` table to confirm lesson ownership
   - Specifically, query where `user_id` matches current user, `lesson_id` matches the lesson, and `status` is 'completed'
   - Update UI based on this confirmation

## Affected Files

1. `app/components/ui/lesson-card.tsx`
   - Update click handlers and button states
   - Modify to show different buttons based on user status

2. `app/components/ui/lesson-preview-dialog.tsx`
   - Ensure proper authentication checks
   - Update button behavior based on user status (owner, purchaser, or potential buyer)

3. `app/components/ui/lesson-access-gate.tsx`
   - Refine authentication and purchase verification logic
   - Ensure it properly uses the purchase status from the database

4. `app/hooks/use-lesson-access.ts`
   - Update to properly query the purchases table with the correct status check
   - Ensure caching is working correctly to avoid excessive database queries

5. `app/components/ui/lesson-checkout.tsx`
   - Improve error handling and authentication flow
   - Ensure proper redirection after successful purchase

6. `app/lessons/[id]/page.tsx`
   - Update page to handle different user states

## Steps to Reproduce

1. Log in as a regular user
2. Browse to the lessons page
3. Click on a lesson card
4. Observe that the interaction doesn't open a preview as expected
5. Click "Purchase Lesson"
6. Note authentication inconsistencies
7. After purchasing a lesson, observe that the button still shows "Purchase Lesson" instead of "Access Lesson"
8. Log in as a creator and note that your own lessons show "Purchase Lesson" instead of "Edit Lesson"

## Expected Behavior

1. **For All Users**:
   - Clicking a lesson card opens a preview dialog
   - Authentication is consistently checked throughout the purchase flow

2. **For Regular Users**:
   - Before purchase: Button shows "Purchase Lesson" and leads directly to Stripe checkout
   - After purchase: Button shows "Access Lesson" with different styling (using the `cn()` utility) and leads to the lesson content

3. **For Creators**:
   - For own lessons: Button shows "Edit Lesson" and leads to the lesson edit page
   - For others' lessons: Same behavior as regular users

## Implementation Requirements

1. **Authentication Logic**:
   - Implement consistent auth checks using the existing auth system
   - Ensure proper handling of unauthenticated users (redirect to auth dialog)

2. **Purchase Verification**:
   - Query the `purchases` table to verify if the current user has purchased the lesson
   - Check for records where:
     ```sql
     user_id = current_user_id AND 
     lesson_id = current_lesson_id AND 
     status = 'completed'
     ```
   - Cache this information appropriately to avoid excessive database queries (the current caching in `use-lesson-access.ts` should be reviewed)

3. **UI Updates**:
   - Modify button text and styling based on user status:
     - For purchasers: Use a success variant with "Access Lesson" text
     - For creators: Use a secondary variant with "Edit Lesson" text
     - For potential buyers: Keep current "Purchase Lesson" styling

4. **Testing Requirements**:
   - Test all user flows: unauthenticated, authenticated non-purchaser, purchaser, and creator
   - Verify proper button states and navigation paths in each scenario
   - Test the purchase flow end-to-end, including Stripe checkout and return to the application

## Additional Context

This issue is critical for improving the user experience and ensuring that users can easily understand their relationship to each lesson (whether they can purchase it, already own it, or created it).

The implementation should leverage the existing `cn()` utility for styling variations and should maintain consistency with the current design system.

## Implementation Plan

### 1. Update `app/components/ui/lesson-card.tsx`

- Integrate `useLessonAccess` hook to check purchase status
- Modify button rendering logic to show different states:
  - For purchasers: "Access Lesson" button with success variant
  - For creators: Keep current "Edit" button (already implemented)
  - For potential buyers: Keep current "Purchase Lesson" button
- Update the button click handlers to navigate appropriately:
  - "Access Lesson" should navigate directly to lesson page
  - "Purchase Lesson" should trigger checkout
  - "Edit" should navigate to edit page (already implemented)

### 2. Update `app/components/ui/lesson-preview-dialog.tsx`

- Similar to lesson card, integrate `useLessonAccess` hook
- Update button states based on user relationship to lesson
- Ensure consistent styling with lesson card buttons
- Improve error handling for authentication issues

### 3. Enhance `app/components/ui/lesson-checkout.tsx`

- Add pre-emptive authentication check before rendering the purchase button
- Improve error messaging for authentication failures
- Add a loading state for the button during authentication checks
- Ensure consistent styling with other components

### 4. Refine `app/hooks/use-lesson-access.ts`

- Verify that the hook is correctly checking for completed purchases
- Ensure proper error handling and retry logic
- Optimize caching to reduce database queries

### 5. Update `app/components/ui/lesson-access-gate.tsx`

- Ensure consistent styling with other components
- Improve error messaging
- Verify proper integration with the access hook

### Button State Logic

```typescript
// Pseudocode for button state logic
if (isOwner) {
  return <EditButton />; // Already implemented
} else if (hasAccess) {
  return <AccessButton />; // New "Access Lesson" button
} else {
  return <PurchaseButton />; // Existing purchase button
}
```

### Styling Updates

Use the `cn()` utility to apply different styles based on button state:

```typescript
// For "Access Lesson" button
<Button 
  variant="success" 
  className={cn("bg-green-600 hover:bg-green-700", className)}
  onClick={() => router.push(`/lessons/${lesson.id}`)}
>
  Access Lesson
</Button>
```

### Authentication Flow

Implement consistent authentication checks:

```typescript
// Pre-emptive auth check
if (!user && !authLoading) {
  return (
    <Button onClick={() => openAuthDialog()}>
      Sign in to Purchase
    </Button>
  );
}
```

### Testing Plan

1. **User Scenarios to Test**:
   - Unauthenticated user viewing lessons
   - Authenticated user who hasn't purchased a lesson
   - Authenticated user who has purchased a lesson
   - Lesson creator viewing their own lessons

2. **Test Cases**:
   - Verify correct button states appear for each user scenario
   - Confirm navigation paths work correctly for each button
   - Test authentication flow during purchase
   - Verify purchase status is correctly reflected after purchase

### Implementation Sequence

1. First update the `useLessonAccess` hook to ensure it provides reliable data
2. Then update the `LessonCard` and `LessonPreviewDialog` components
3. Finally, refine the `LessonCheckout` and `LessonAccessGate` components

This approach ensures that the core functionality is solid before updating the UI components.

## Labels
- enhancement
- bug
