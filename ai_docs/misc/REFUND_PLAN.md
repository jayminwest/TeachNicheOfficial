# Refund Implementation Plan

## Type Definitions

```typescript
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RefundRequest {
  id: string;
  purchase_id: string;
  user_id: string;
  creator_id: string;
  amount: number; // In cents
  reason: string;
  status: RefundStatus;
  stripe_refund_id?: string;
  created_at: string;
  updated_at: string;
}
```

## Database Schema

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  user_id UUID REFERENCES auth.users(id),
  creator_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status RefundStatus NOT NULL DEFAULT 'pending',
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Add RLS policies
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refunds"
  ON refunds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can view refunds for their lessons"
  ON refunds FOR SELECT
  USING (auth.uid() = creator_id);
```

## Business Rules

```typescript
// lib/constants.ts
export const REFUND_RULES = {
  WINDOW_DAYS: 30, // Refund window in days
  MIN_WATCH_PERCENT: 25, // Maximum watched percentage allowed for refund
  AUTOMATIC_APPROVAL_WINDOW_HOURS: 24, // Auto-approve if within first 24h
  MAX_REFUNDS_PER_USER_MONTH: 3 // Limit refunds per user
} as const;
```

## Implementation Components

### 1. Refund Handler API Route

```typescript
// app/api/purchases/[id]/refund/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get purchase details
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, lessons(*)')
    .eq('id', params.id)
    .single();

  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  // Check refund eligibility
  const isEligible = await checkRefundEligibility(purchase, session.data.session.user);
  if (!isEligible.allowed) {
    return NextResponse.json({ error: isEligible.reason }, { status: 400 });
  }

  try {
    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: purchase.payment_intent_id,
      reason: 'requested_by_customer'
    });

    // Record refund in database
    const { data: refundRecord, error } = await supabase
      .from('refunds')
      .insert({
        purchase_id: purchase.id,
        user_id: session.data.session.user.id,
        creator_id: purchase.creator_id,
        amount: purchase.amount,
        reason: request.body.reason,
        stripe_refund_id: refund.id,
        status: 'processing'
      })
      .select()
      .single();

    if (error) throw error;

    // Update purchase status
    await supabase
      .from('purchases')
      .update({ status: 'refunded' })
      .eq('id', purchase.id);

    return NextResponse.json({ refund: refundRecord });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
```

### 2. Eligibility Check

```typescript
// lib/refunds.ts
async function checkRefundEligibility(
  purchase: Purchase,
  user: User
): Promise<{ allowed: boolean; reason?: string }> {
  // Check time window
  const purchaseDate = new Date(purchase.created_at);
  const daysSincePurchase = differenceInDays(new Date(), purchaseDate);
  if (daysSincePurchase > REFUND_RULES.WINDOW_DAYS) {
    return { allowed: false, reason: 'Outside refund window' };
  }

  // Check watch percentage
  const watchStats = await getMuxWatchStats(purchase.lesson_id, user.id);
  if (watchStats.percentWatched > REFUND_RULES.MIN_WATCH_PERCENT) {
    return { allowed: false, reason: 'Exceeded watch limit' };
  }

  // Check monthly refund limit
  const recentRefunds = await getRecentRefunds(user.id);
  if (recentRefunds.length >= REFUND_RULES.MAX_REFUNDS_PER_USER_MONTH) {
    return { allowed: false, reason: 'Monthly refund limit reached' };
  }

  return { allowed: true };
}
```

### 3. Access Control Integration

```typescript
// hooks/use-lesson-access.ts
// Update access check to include refund status
const { data: purchase } = await supabase
  .from('purchases')
  .select('status')
  .eq('user_id', user.id)
  .eq('lesson_id', lessonId)
  .eq('status', 'completed')
  .neq('status', 'refunded') // Exclude refunded purchases
  .single();
```

## Key Features

1. Clear Refund Windows and Limits
   - 30-day refund window
   - Maximum 25% watch time for eligibility
   - 3 refunds per user per month
   - Automatic approval within first 24 hours

2. User and Creator Perspectives
   - Users can request refunds within limits
   - Creators can view refunds for their content
   - Platform maintains oversight

3. Record Keeping
   - Complete refund history
   - Audit trail of requests and decisions
   - Status tracking throughout process

4. Access Management
   - Immediate access revocation on refund
   - Clear status checks in access control
   - Proper handling of partial refunds

5. Security
   - Row Level Security policies
   - Proper authentication checks
   - Audit trail maintenance

## Testing Strategy

1. Unit Tests
   - Eligibility checks
   - Business rule validation
   - Status transitions

2. Integration Tests
   - Complete refund flow
   - Stripe integration
   - Access revocation

3. Edge Cases
   - Partial refunds
   - Multiple refund attempts
   - Concurrent requests

## Monitoring

1. Key Metrics
   - Refund rate by lesson
   - Average time to refund
   - Refund reasons distribution

2. Alerts
   - High refund rates
   - Failed refund processing
   - Stripe integration issues

## Deployment Checklist

1. Database
   - Create refunds table
   - Add RLS policies
   - Create indexes

2. Environment Variables
   - Stripe configuration
   - Refund window settings
   - Rate limits

3. Stripe Setup
   - Configure webhook endpoints
   - Test refund processing
   - Monitor integration

4. Monitoring
   - Set up logging
   - Configure alerts
   - Track key metrics
