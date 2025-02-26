# Payment Integration Guide

This guide explains how to integrate with the Teach Niche payment system, which uses a merchant of record model.

## Overview

Teach Niche acts as the merchant of record for all transactions on the platform. This means:

1. All payments are processed through Teach Niche's Stripe account
2. Creator earnings are tracked in our database
3. Creators receive periodic payouts based on accumulated earnings
4. Teach Niche handles tax collection and compliance

## Key Components

### Payment Processing

- `app/services/stripe.ts` - Core Stripe integration
- `app/components/ui/lesson-checkout.tsx` - Checkout UI component
- `/api/payments/create-checkout` - API endpoint to initiate checkout
- `/api/webhooks/stripe` - Webhook handler for payment events

### Earnings Tracking

- `app/services/earnings.ts` - Service for tracking creator earnings
- Database tables: `creator_earnings`, `creator_payouts`, `creator_payout_methods`

### Payout Processing

- `app/services/payouts.ts` - Service for processing creator payouts
- `/api/cron/process-payouts` - Scheduled endpoint for processing payouts

## Implementation Guide

### 1. Processing Payments

To process a payment for a lesson:

```typescript
import { createCheckoutSession } from '@/app/services/stripe';

// In your component or API route
const handlePurchase = async (lessonId: string, userId: string) => {
  try {
    const { url } = await createCheckoutSession({
      lessonId,
      userId,
      successUrl: `${window.location.origin}/lessons/${lessonId}/success`,
      cancelUrl: `${window.location.origin}/lessons/${lessonId}`,
    });
    
    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Payment error:', error);
    // Handle error
  }
};
```

### 2. Handling Webhooks

Stripe webhooks are processed by the `/api/webhooks/stripe` endpoint. When a payment is successful:

1. The webhook verifies the payment
2. Creates a purchase record
3. Records creator earnings
4. Grants access to the lesson

### 3. Tracking Earnings

Creator earnings are automatically tracked when a payment is successful:

```typescript
import { recordEarnings } from '@/app/services/earnings';

// Record earnings for a creator
await recordEarnings({
  creatorId,
  lessonId,
  purchaseId,
  amount,
  platformFee,
  creatorEarnings,
});
```

### 4. Processing Payouts

Payouts are processed on a schedule (weekly/monthly) using the `/api/cron/process-payouts` endpoint:

1. Identifies creators eligible for payout
2. Calculates total earnings to be paid
3. Processes payouts via Stripe
4. Updates earnings records to mark them as paid

## Testing Payments Locally

To test the payment flow locally:

1. Install the Stripe CLI
2. Forward webhooks to your local environment:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Security Considerations

- Never log full payment details
- Use Stripe Elements for collecting bank account information
- Store only bank tokens, not actual account numbers
- Implement proper access controls for financial data
- Regularly audit payment and payout processes

## Troubleshooting

### Common Issues

1. **Webhook Verification Failures**
   - Check that the webhook secret in your environment matches the one in Stripe

2. **Payment Processing Errors**
   - Verify the Stripe API key is correct
   - Check that the product and price IDs exist in Stripe

3. **Payout Failures**
   - Verify the creator has a valid bank account set up
   - Check for sufficient platform balance in Stripe

## Reference

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Payouts API](https://stripe.com/docs/api/payouts)

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
