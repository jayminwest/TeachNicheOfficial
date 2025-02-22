# Payment Integration Standards

## Stripe Setup

### Configuration
```typescript
// services/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
```

### Connect Account Setup
```typescript
async function createConnectAccount(userId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      userId,
    },
  })
  
  return account
}
```

## Payment Processing

### Checkout Session
```typescript
async function createCheckoutSession(lessonId: string, userId: string) {
  const lesson = await getLessonDetails(lessonId)
  
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: lesson.title,
        },
        unit_amount: lesson.price * 100,
      },
      quantity: 1,
    }],
    metadata: {
      lessonId,
      userId,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/lessons/${lessonId}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/lessons/${lessonId}?canceled=true`,
  })
}
```

### Webhook Handling
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event.data.object)
        break
      case 'account.updated':
        await handleConnectAccountUpdate(event.data.object)
        break
      // Handle other events...
    }
    
    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      'Webhook error: ' + (error as Error).message,
      { status: 400 }
    )
  }
}
```

## Creator Payouts

### Transfer Configuration
```typescript
async function createTransfer(
  amount: number,
  destinationAccount: string,
  paymentIntent: string
) {
  return stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: destinationAccount,
    transfer_group: paymentIntent,
  })
}
```

### Platform Fee Calculation
```typescript
function calculatePlatformFee(amount: number): {
  platformFee: number,
  creatorPayout: number
} {
  const platformFeePercentage = 0.10 // 10%
  const platformFee = Math.round(amount * platformFeePercentage)
  const creatorPayout = amount - platformFee
  
  return {
    platformFee,
    creatorPayout,
  }
}
```

## Error Handling

### Payment Errors
```typescript
async function handlePaymentError(error: Stripe.StripeError) {
  switch (error.type) {
    case 'StripeCardError':
      throw new Error('Your card was declined.')
    case 'StripeInvalidRequestError':
      throw new Error('Invalid payment request.')
    case 'StripeConnectionError':
      throw new Error('Network error. Please try again.')
    default:
      throw new Error('An unexpected error occurred.')
  }
}
```

### Refund Processing
```typescript
async function processRefund(
  paymentIntentId: string,
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent'
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
    })
    
    await updateOrderStatus(refund.payment_intent, 'refunded')
    return refund
  } catch (error) {
    logger.error('Refund failed:', error)
    throw new Error('Failed to process refund')
  }
}
```

## Testing

### Test Mode
```typescript
const testStripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
```

### Test Cards
```typescript
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  expired: '4000000000000069',
}
```

### Webhook Testing
```typescript
describe('Stripe Webhooks', () => {
  it('handles successful payment', async () => {
    const event = createTestEvent('checkout.session.completed')
    const response = await handleWebhook(event)
    expect(response.status).toBe(200)
  })
})
```

## Security

### Data Handling
- Never log full card details
- Encrypt sensitive data
- Use webhook signatures
- Validate all inputs

### PCI Compliance
- Use Stripe Elements
- Never handle raw card data
- Follow security guidelines
- Regular security audits

## Monitoring

### Payment Monitoring
```typescript
function logPaymentEvent(
  type: 'success' | 'failure' | 'refund',
  data: object
) {
  logger.info('Payment event:', {
    type,
    timestamp: new Date().toISOString(),
    ...data,
  })
}
```

### Error Tracking
```typescript
function trackStripeError(error: Stripe.StripeError) {
  logger.error('Stripe error:', {
    type: error.type,
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
  })
}
```
