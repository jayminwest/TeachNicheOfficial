# Issue: Migrate to Stripe Connect Express and Implement Product/Price Creation for Paid Lessons

## Description
Currently, our platform uses Stripe Connect Standard for instructor payments, but we need to migrate to Stripe Connect Express for a more streamlined onboarding experience. Additionally, we need to implement automatic Stripe product and price creation for paid lessons to ensure proper payment processing.

## Technical Requirements

### 1. Migrate to Stripe Connect Express
- Update `stripeConfig` in `app/services/stripe.ts` to use 'express' instead of 'standard'
- Modify the account creation process in `app/api/stripe/connect/route.ts` to create Express accounts
- Update the Connect session creation to use the appropriate parameters for Express accounts
- Enhance the callback handling in `app/api/stripe/connect/callback/route.ts` to properly process Express account completions

### 2. Implement Stripe Product/Price Creation for Lessons
- Update `app/api/lessons/route.ts` to create Stripe products and prices when a paid lesson is created
- Update `app/api/lessons/[id]/route.ts` to handle price updates by creating new Stripe prices
- Store the `stripe_product_id` and `stripe_price_id` in the lessons table
- Implement proper error handling and rollback mechanisms

### 3. Enhance User Experience
- Improve validation in `app/components/ui/lesson-form.tsx` to clearly communicate Stripe account requirements
- Add status indicators in the profile section to show Stripe account connection status
- Provide clear error messages throughout the Connect process

## Affected Files

### Core Stripe Integration
- `app/services/stripe.ts`
  - Update `connectType` from 'standard' to 'express'
  - Add helper functions for Express account management

- `app/components/ui/stripe-connect-button.tsx`
  - Update to handle Express-specific parameters
  - Improve error handling and user feedback

- `app/api/stripe/connect/route.ts`
  - Modify account creation to use Express account type
  - Update parameters for Express onboarding

- `app/api/stripe/connect/callback/route.ts`
  - Update to handle Express-specific callback parameters
  - Enhance verification for Express accounts

- `app/api/stripe/connect/status/route.ts`
  - Update status checks for Express accounts

### Lesson Management
- `app/api/lessons/route.ts`
  - Add Stripe product creation for paid lessons
  - Add Stripe price creation for paid lessons
  - Store product and price IDs in the database

- `app/api/lessons/[id]/route.ts`
  - Add logic to update Stripe prices when lesson prices change
  - Maintain synchronization between our database and Stripe

- `app/components/ui/lesson-form.tsx`
  - Enhance validation for Stripe account requirements
  - Improve user feedback for paid lessons

### Webhook Handling
- `app/api/webhooks/stripe/route.ts`
  - Update to handle Express-specific account events
  - Add handling for product and price events if needed

## Implementation Details

### Stripe Connect Express Migration
1. Update the configuration:
```typescript
// In app/services/stripe.ts
export const stripeConfig: StripeConfig = {
  // ...existing config
  connectType: 'express', // Change from 'standard' to 'express'
  // ...
};
```

2. Modify account creation:
```typescript
// In app/api/stripe/connect/route.ts
const account = await accounts.create({
  type: 'express', // Change from 'standard' to 'express'
  email: user.email,
  // ...other parameters
});
```

3. Update account link creation to use Express-specific parameters:
```typescript
// In app/api/stripe/connect/route.ts
const accountLink = await createConnectSession({
  accountId: account.id,
  refreshUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=connect-refresh`,
  returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/callback?account_id=${account.id}`,
  type: 'account_onboarding'
});
```

### Stripe Product/Price Creation
1. Add product creation to lesson creation:
```typescript
// In app/api/lessons/route.ts
// After creating the lesson in the database
if (price > 0 && stripeAccountId) {
  // Create a Stripe product
  const product = await stripe.products.create({
    name: title,
    description: description || undefined,
    metadata: {
      lesson_id: lessonId
    }
  });
  
  // Create a Stripe price
  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(price * 100), // Convert to cents
    currency: stripeConfig.defaultCurrency,
  });
  
  // Update the lesson with Stripe IDs
  await supabase
    .from('lessons')
    .update({
      stripe_product_id: product.id,
      stripe_price_id: stripePrice.id
    })
    .eq('id', lessonId);
}
```

2. Add price updates to lesson updates:
```typescript
// In app/api/lessons/[id]/route.ts
// If the price has changed
if (data.price !== lesson.price && data.price > 0) {
  // Create a new Stripe price
  const stripePrice = await stripe.prices.create({
    product: lesson.stripe_product_id || (await createProductForLesson(lesson)),
    unit_amount: Math.round(data.price * 100), // Convert to cents
    currency: stripeConfig.defaultCurrency,
  });
  
  // Update the lesson with the new price ID
  data.stripe_price_id = stripePrice.id;
}
```

## Testing Requirements
- Test the complete Stripe Connect Express onboarding flow
- Test creating paid lessons with and without a connected Stripe account
- Test updating lesson prices and verifying Stripe price updates
- Test the webhook handling for account updates
- Verify proper database updates for all operations

## Acceptance Criteria
- Users can successfully connect their Stripe accounts via the Connect Express flow
- Connected users can create paid lessons with proper Stripe product/price creation
- Users can update lesson prices with proper Stripe price updates
- The system prevents users without connected Stripe accounts from creating paid lessons
- All error cases are properly handled with appropriate user feedback
- Database remains in sync with Stripe for all operations
- Webhook handling properly processes account updates and payment events

## Additional Notes
- We'll need to test this in Stripe's test mode before going to production
- We should consider adding a dashboard for instructors to view their earnings and payout status
- Documentation should be updated to reflect the new Connect Express flow
