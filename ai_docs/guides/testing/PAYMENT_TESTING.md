# Payment Testing Guide

This guide outlines how to test payment flows in the Teach Niche platform, which uses a merchant of record model.

## Overview

The payment system consists of several components:
1. Checkout flow for lesson purchases
2. Webhook handling for payment events
3. Earnings tracking for creators
4. Payout processing to creator bank accounts

## Test Environment Setup

### Prerequisites

- Stripe CLI installed
- Test API keys configured in your `.env.local` file
- Local development server running

### Environment Variables

Ensure these variables are set in your `.env.local` file:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Starting the Webhook Listener

To test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret that you should add to your `.env.local` file.

## Testing the Checkout Flow

### Test Cards

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 3220 | 3D Secure authentication |

Expiration date: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

### Manual Testing Steps

1. **Create a Test Lesson**
   - Log in as a creator
   - Create a new lesson with a price
   - Publish the lesson

2. **Purchase the Lesson**
   - Log in as a different user
   - Navigate to the lesson page
   - Click "Purchase" button
   - Complete checkout with a test card

3. **Verify Purchase**
   - Check that you have access to the lesson
   - Verify the purchase record in the database
   - Confirm creator earnings were recorded

### Automated Testing

Use Playwright for end-to-end testing:

```typescript
// Example Playwright test for lesson purchase
test('User can purchase a lesson', async ({ page }) => {
  // Log in as a user
  await login(page, 'test-buyer@example.com', 'password');
  
  // Navigate to a lesson
  await page.goto('/lessons/test-lesson-id');
  
  // Click purchase button
  await page.click('[data-testid="purchase-button"]');
  
  // Fill in payment details
  await page.fill('[data-testid="cardNumber"]', '4242424242424242');
  await page.fill('[data-testid="cardExpiry"]', '12/30');
  await page.fill('[data-testid="cardCvc"]', '123');
  await page.fill('[data-testid="billingName"]', 'Test User');
  await page.fill('[data-testid="billingPostalCode"]', '12345');
  
  // Complete purchase
  await page.click('[data-testid="submit-payment"]');
  
  // Verify success
  await page.waitForSelector('[data-testid="purchase-success"]');
  
  // Verify access to content
  await page.goto('/lessons/test-lesson-id/content');
  await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
});
```

## Testing Webhooks

### Triggering Test Events

Use the Stripe CLI to trigger test webhook events:

```bash
# Successful payment
stripe trigger payment_intent.succeeded

# Failed payment
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded
```

### Verifying Webhook Processing

After triggering a webhook event:

1. Check the server logs for webhook processing
2. Verify database records were updated correctly
3. Confirm the appropriate actions were taken

## Testing Creator Earnings

### Verifying Earnings Recording

After a successful purchase:

1. Log in as the creator
2. Navigate to the earnings dashboard
3. Verify the new earnings are displayed
4. Check the database to confirm the earnings record

### Testing Earnings Calculations

Create test purchases with different amounts to verify:

1. Platform fee is calculated correctly
2. Creator earnings amount is accurate
3. Totals are displayed correctly in the dashboard

## Testing Payouts

### Setting Up Test Bank Accounts

Use Stripe test bank account numbers:

| Country | Routing Number | Account Number |
|---------|---------------|----------------|
| US | 110000000 | 000123456789 |
| GB | 108800 | 00012345 |
| EU | IBAN: DE89370400440532013000 | |

### Testing Bank Account Setup

1. Log in as a creator
2. Navigate to the payout settings
3. Add a test bank account
4. Verify the bank account appears in the dashboard

### Testing Payout Processing

To test the payout process:

1. Ensure there are pending earnings for a creator
2. Trigger the payout process:
   ```bash
   curl -X POST http://localhost:3000/api/admin/process-payouts
   ```
3. Verify payout records are created
4. Check that earnings are marked as paid
5. Confirm the payout appears in the creator's dashboard

## Testing Refunds

### Processing a Test Refund

1. Find a completed purchase in Stripe Dashboard
2. Issue a refund through the Stripe Dashboard
3. Verify the webhook is received and processed
4. Check that the purchase status is updated to "refunded"
5. Verify creator earnings are adjusted accordingly

## Common Testing Issues

### Webhook Verification Failures

If webhooks fail with signature verification errors:
- Ensure the webhook secret in your `.env.local` matches the one from Stripe CLI
- Check that the raw request body is being used for verification
- Verify the timestamp in the webhook is not too old

### Payment Processing Errors

If payments fail unexpectedly:
- Check Stripe logs for detailed error messages
- Verify API keys are correct and have appropriate permissions
- Ensure product and price IDs exist in Stripe

### Payout Processing Issues

If payouts fail:
- Verify the bank account details are valid test accounts
- Check that the creator has sufficient earnings
- Ensure the Stripe account has payouts enabled in test mode

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-26 | Testing Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
