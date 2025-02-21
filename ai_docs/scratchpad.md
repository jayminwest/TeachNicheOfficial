# Lesson Purchase Flow Implementation Plan

## Type Definitions

```typescript
interface PurchaseError {
  code: string
  message: string
  details?: Record<string, any>
}

interface Purchase {
  id: string
  user_id: string
  lesson_id: string
  creator_id: string
  purchase_date: string
  stripe_session_id: string
  amount: number // In cents
  platform_fee: number // In cents
  creator_earnings: number // In cents
  payment_intent_id: string
  fee_percentage: number
  status: 'pending' | 'completed' | 'failed'
  error?: PurchaseError
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  version: number
}

interface LessonAccess {
  hasAccess: boolean
  purchaseStatus?: 'none' | 'pending' | 'completed'
  purchaseDate?: string
}

interface PurchaseApiResponse {
  checkoutUrl: string
  sessionId: string
}
```

## Implementation Steps

### Step 1: Create Access Control Hook
File: app/hooks/use-lesson-access.ts

```typescript
import { useEffect, useState } from 'react'
import { useAuth } from '@/services/auth/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export function useLessonAccess(lessonId: string) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  // Cache access check results
  const cacheKey = `lesson-access-${lessonId}-${user?.id}`
  
  useEffect(() => {
    const TIMEOUT_MS = 5000
    const RETRY_ATTEMPTS = 3
    let attempts = 0
    let timeoutId: NodeJS.Timeout

    async function checkAccess() {
      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      // Check cache first
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { hasAccess: cachedAccess, timestamp } = JSON.parse(cached)
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setHasAccess(cachedAccess)
          setLoading(false)
          return
        }
      }

      try {
        timeoutId = setTimeout(() => {
          throw new Error('Access check timed out')
        }, TIMEOUT_MS)

        const { data: purchase } = await supabase
          .from('purchases')
          .select('status')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .eq('status', 'completed')
          .single()

        clearTimeout(timeoutId)
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          hasAccess: !!purchase,
          timestamp: Date.now()
        }))

        setHasAccess(!!purchase)
        setError(null)
      } catch (error) {
        console.error('Error checking lesson access:', error)
        setError(error as Error)
        setHasAccess(false)
        
        // Retry logic
        if (attempts < RETRY_ATTEMPTS) {
          attempts++
          setTimeout(checkAccess, 1000 * attempts)
        }
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }

    checkAccess()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [lessonId, user, cacheKey])

  return { hasAccess, loading, error }
}
```

### Step 2: Create Access Gate Component
File: app/components/ui/lesson-access-gate.tsx

```typescript
import { Loader2 } from 'lucide-react'
import { useLessonAccess } from '@/hooks/use-lesson-access'
import { LessonCheckout } from './lesson-checkout'

interface LessonAccessGateProps {
  lessonId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LessonAccessGate({ 
  lessonId,
  children,
  fallback 
}: LessonAccessGateProps) {
  const { hasAccess, loading } = useLessonAccess(lessonId)
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (!hasAccess) {
    return fallback || <LessonCheckout lessonId={lessonId} />
  }
  
  return <>{children}</>
}
```

### Step 3: Purchase API Route
File: app/api/lessons/purchase/route.ts

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { lessonId } = await request.json()

    // Get lesson details
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*, profiles(stripe_account_id)')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: lesson.stripe_price_id,
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=cancelled`,
      payment_intent_data: {
        application_fee_amount: Math.round(lesson.price * 0.1), // 10% platform fee
        transfer_data: {
          destination: lesson.profiles.stripe_account_id,
        },
      },
      metadata: {
        lessonId,
        userId: session.user.id,
        creatorId: lesson.creator_id
      }
    })

    // Record pending purchase
    await supabase.from('purchases').insert({
      user_id: session.user.id,
      lesson_id: lessonId,
      creator_id: lesson.creator_id,
      stripe_session_id: checkoutSession.id,
      amount: lesson.price,
      platform_fee: lesson.price * 0.1,
      creator_earnings: lesson.price * 0.9,
      fee_percentage: 10,
      status: 'pending'
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

### Step 4: Update Stripe Webhook Handler
The webhook handler should:

1. Verify Stripe signature
2. Handle 'checkout.session.completed' event:
   - Get purchase record using stripe_session_id
   - Update status to 'completed'
   - Set payment_intent_id
   - Update purchase_date
   - Record final amounts and fees

### Step 5: Video Player Integration
Wrap VideoPlayer component with LessonAccessGate:

```typescript
export function VideoPlayer({ playbackId, lessonId, ...props }) {
  return (
    <LessonAccessGate lessonId={lessonId}>
      <MuxPlayer
        playbackId={playbackId}
        {...props}
      />
    </LessonAccessGate>
  )
}
```

### Step 6: Testing Strategy

1. Unit Tests:
```typescript
describe('useLessonAccess', () => {
  it('returns false when user is not authenticated')
  it('returns true for completed purchases')
  it('returns false for pending purchases')
  it('returns false when no purchase exists')
})

describe('LessonAccessGate', () => {
  it('shows loading state')
  it('shows purchase UI when no access')
  it('renders children when has access')
})

describe('purchase API', () => {
  it('creates Stripe session')
  it('records pending purchase')
  it('handles unauthorized requests')
})
```

2. Integration Tests:
- Complete purchase flow
- Webhook handling
- Access state updates

3. Error Cases:
- Network failures
- Invalid lesson IDs
- Stripe errors
- Database errors

### Step 7: Deployment Checklist

1. Environment Variables:
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=
```

2. Database Indexes:
```sql
CREATE INDEX idx_purchases_user_lesson ON purchases(user_id, lesson_id, status);
```

3. Stripe Setup:
- Configure webhook endpoints
- Set up product/price mapping
- Test mode configuration

4. Monitoring:
- Log purchase attempts
- Track webhook processing
- Monitor access checks

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
