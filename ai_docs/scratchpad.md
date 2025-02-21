# Lesson Purchase Flow Implementation Plan

## Files Needed for Complete Implementation
- app/hooks/use-lesson-access.ts (new)
- app/components/ui/lesson-access-gate.tsx (new)
- app/api/lessons/purchase/route.ts (new)
- app/api/webhooks/stripe/route.ts (existing)
- app/components/ui/video-player.tsx (existing)
- app/components/ui/lesson-checkout.tsx (existing)
- app/services/stripe.ts (existing)
- app/services/auth/AuthContext.tsx (existing)
- app/lessons/[id]/page.tsx (existing)
- types/lesson.ts (existing)

## Implementation Steps

### Step 1: Create Access Control Hook
Files needed:
- app/hooks/use-lesson-access.ts

Purpose:
- Check if user has purchased lesson
- Handle free vs paid content
- Cache access state

### Step 2: Create Access Gate Component  
Files needed:
- app/components/ui/lesson-access-gate.tsx
- app/hooks/use-lesson-access.ts

Purpose:
- Wrap protected content
- Show purchase UI when needed
- Handle loading states

### Step 3: Setup Purchase API Route
Files needed:
- app/api/lessons/purchase/route.ts
- app/services/stripe.ts

Purpose:
- Create Stripe checkout session
- Record pending purchase
- Handle success/failure

### Step 4: Update Stripe Webhook Handler
Files needed:
- app/api/webhooks/stripe/route.ts

Purpose:
- Handle checkout.session.completed
- Update purchase status
- Trigger any post-purchase actions

### Step 5: Integrate Video Player Protection
Files needed:
- app/components/ui/video-player.tsx
- app/components/ui/lesson-access-gate.tsx

Purpose:
- Gate video content behind purchase
- Handle free preview content
- Show appropriate UI states

### Step 6: Update Lesson Detail Page
Files needed:
- app/lessons/[id]/page.tsx
- app/components/ui/lesson-access-gate.tsx
- app/components/ui/lesson-checkout.tsx

Purpose:
- Add purchase flow
- Show lesson content appropriately
- Handle purchase states

### Step 7: Add Purchase Status to Lesson Card
Files needed:
- app/components/ui/lesson-card.tsx
- app/hooks/use-lesson-access.ts

Purpose:
- Show purchase status
- Update UI based on access
- Quick access status check

### Step 8: Error Handling & User Feedback
Files needed:
- All components above
- Add toast notifications
- Add error boundaries
- Improve loading states

### Step 9: Testing & Validation
- Test purchase flow end-to-end
- Verify access control
- Check error handling
- Validate webhook handling

### Step 10: Documentation & Cleanup
- Document new components
- Add usage examples
- Clean up any TODOs
- Update types
