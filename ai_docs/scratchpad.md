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

Implementation Details:
```typescript
// Create hook to check lesson access
export function useLessonAccess(lessonId: string) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check purchases table for valid purchase
    // Handle free lessons
    // Cache results
  }, [lessonId, user]);
  
  return { hasAccess, loading };
}
```

Key Changes:
- Create new hook file
- Implement purchase checking logic
- Add caching for performance
- Handle loading states

### Step 2: Create Access Gate Component
Files needed:
- app/components/ui/lesson-access-gate.tsx

Implementation Details:
```typescript
export function LessonAccessGate({ 
  lessonId,
  children,
  fallback 
}: LessonAccessGateProps) {
  const { hasAccess, loading } = useLessonAccess(lessonId);
  
  if (loading) return <LoadingSpinner />;
  if (!hasAccess) return fallback || <PurchasePrompt />;
  
  return <>{children}</>;
}
```

Key Changes:
- Create new component
- Use access hook
- Handle loading/unauthorized states
- Show purchase UI when needed

### Step 3: Setup Purchase API Route
Files needed:
- app/api/lessons/purchase/route.ts

Implementation Details:
```typescript
export async function POST(request: Request) {
  // Validate user session
  // Get lesson details
  // Create Stripe checkout session
  // Record pending purchase
  // Return checkout URL
}
```

Key Changes:
- Create new API route
- Add session validation
- Implement Stripe checkout
- Record purchase attempt

### Step 4: Update Stripe Webhook Handler
Files needed:
- app/api/webhooks/stripe/route.ts

Implementation Details:
```typescript
// Add to webhook handler
case 'checkout.session.completed':
  await handleCheckoutCompleted(session);
  break;

async function handleCheckoutCompleted(session) {
  // Update purchase status
  // Record payment details
  // Handle any post-purchase actions
}
```

Key Changes:
- Add checkout completion handler
- Update purchase records
- Handle payment confirmation

### Step 5: Integrate Video Player Protection
Files needed:
- app/components/ui/video-player.tsx

Implementation Details:
```typescript
export function VideoPlayer({ playbackId, ...props }) {
  return (
    <LessonAccessGate lessonId={props.id}>
      <MuxPlayer playbackId={playbackId} {...props} />
    </LessonAccessGate>
  );
}
```

Key Changes:
- Wrap player in access gate
- Handle unauthorized state
- Preserve existing props

### Step 6: Update Lesson Detail Page
Files needed:
- app/lessons/[id]/page.tsx

Implementation Details:
```typescript
export default function LessonPage({ params }) {
  return (
    <LessonAccessGate lessonId={params.id}>
      <LessonContent />
    </LessonAccessGate>
  );
}
```

Key Changes:
- Add access gate wrapper
- Show purchase UI when needed
- Handle loading states

### Step 7: Add Purchase Status to Lesson Card
Files needed:
- app/components/ui/lesson-card.tsx

Implementation Details:
```typescript
export function LessonCard({ lesson }) {
  const { hasAccess } = useLessonAccess(lesson.id);
  
  return (
    <Card>
      {hasAccess && <PurchasedBadge />}
      <LessonDetails />
    </Card>
  );
}
```

Key Changes:
- Add access status check
- Show purchase indicator
- Update card UI

### Step 8: Error Handling & User Feedback
Implementation Details:
- Add toast notifications for purchase events
- Implement error boundaries
- Add loading indicators
- Handle edge cases

### Step 9: Testing & Validation
Implementation Details:
- Write unit tests for new components
- Add integration tests for purchase flow
- Test error scenarios
- Validate webhook handling

### Step 10: Documentation & Cleanup
Implementation Details:
- Document new components
- Add usage examples
- Update type definitions
- Clean up TODOs

## Testing Strategy

For each component:
1. Unit tests for individual pieces
2. Integration tests for purchase flow
3. Error handling validation
4. Performance testing

## Rollout Plan

1. Deploy access control components
2. Add purchase flow
3. Enable video protection
4. Roll out UI updates
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
