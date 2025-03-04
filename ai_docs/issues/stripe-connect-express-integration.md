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

## Test-Driven Development Approach

Following our project's "Testing First" philosophy, implement this feature using TDD:

### 1. Unit Tests First

Start by writing unit tests for the Stripe service functions:

```typescript
// File: app/services/stripe.test.ts

import { jest } from '@jest/globals';
import { 
  stripeConfig, 
  createConnectSession, 
  getAccountStatus,
  verifyConnectedAccount 
} from '@/app/services/stripe';
import { createMockResponse, createAsyncMock } from '@/mocks/utils/mock-helpers';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn()
    },
    accountLinks: {
      create: jest.fn()
    },
    products: {
      create: jest.fn()
    },
    prices: {
      create: jest.fn()
    }
  }));
});

describe('Stripe Service - Connect Express', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stripeConfig should use express connect type', () => {
    expect(stripeConfig.connectType).toBe('express');
  });

  test('createConnectSession should create account link with express parameters', async () => {
    // Test implementation
  });

  test('getAccountStatus should correctly parse Express account details', async () => {
    // Test implementation
  });
});

describe('Stripe Service - Product/Price Creation', () => {
  // Test product creation
  // Test price creation
  // Test error handling
});
```

### 2. API Route Tests

Next, write tests for the API routes:

```typescript
// File: app/api/stripe/connect/route.test.ts

import { POST } from '@/app/api/stripe/connect/route';
import { createMockResponse } from '@/mocks/utils/mock-helpers';
import { MockRequest } from '@/app/api/__tests__/requests.test';

// Mock dependencies
jest.mock('@/app/services/stripe', () => ({
  getStripe: jest.fn().mockReturnValue({
    accounts: {
      create: jest.fn().mockResolvedValue({ id: 'acct_test123' })
    }
  }),
  createConnectSession: jest.fn().mockResolvedValue({ url: 'https://connect.stripe.com/express/test' }),
  stripeConfig: { connectType: 'express' }
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn().mockReturnValue({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user123', email: 'test@example.com' } } }
      })
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })
    })
  })
}));

describe('Stripe Connect API Route', () => {
  test('POST should create Express account and return redirect URL', async () => {
    // Test implementation
  });

  test('POST should handle authentication errors', async () => {
    // Test implementation
  });

  // More tests for error cases
});

// Similar tests for callback route and lesson creation with Stripe product/price
```

### 3. Integration Tests

Write integration tests that verify the interaction between components:

```typescript
// File: app/api/lessons/integration.test.ts

import { POST as createLesson } from '@/app/api/lessons/route';
import { createMockResponse } from '@/mocks/utils/mock-helpers';
import { MockRequest } from '@/app/api/__tests__/requests.test';

// Mock dependencies but allow some real interactions

describe('Lesson Creation with Stripe Product/Price', () => {
  test('should create Stripe product and price for paid lesson', async () => {
    // Test implementation
  });

  test('should not create Stripe product for free lesson', async () => {
    // Test implementation
  });

  test('should handle Stripe API errors gracefully', async () => {
    // Test implementation
  });
});
```

### 4. End-to-End Tests with Playwright

Create Playwright tests for the complete user journey:

```typescript
// File: e2e/stripe-connect.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Stripe Connect Express Flow', () => {
  test('instructor can connect Stripe account', async ({ page }) => {
    // Login as instructor
    // Navigate to profile
    // Click connect with Stripe
    // Verify redirect to Stripe
    // Mock successful return from Stripe
    // Verify success message
  });

  test('instructor can create paid lesson after connecting Stripe', async ({ page }) => {
    // Login as connected instructor
    // Create new lesson with price
    // Verify lesson created successfully
    // Verify Stripe product and price created
  });
});
```

### 5. Test Implementation Order

For each component of this feature:
1. Write the failing test first
2. Implement the minimum code to make the test pass
3. Refactor while keeping tests passing
4. Move to the next test

Start with the core service functions, then API routes, then UI components.

## Database Schema Updates

Add the following columns to the lessons table if they don't already exist:

```sql
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS previous_stripe_price_ids JSONB DEFAULT '[]'::jsonb;
```

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

## Error Handling and Rollback Strategy

Implement the following error handling approach:

1. **Transaction-based Operations**:
   - Use database transactions when creating/updating lessons and Stripe resources
   - Roll back database changes if Stripe operations fail

2. **Specific Error Scenarios**:
   - Handle Stripe API errors (network, authentication, validation)
   - Handle database errors
   - Handle user permission errors

3. **Rollback Implementation**:
   - For lesson creation: Delete the lesson if Stripe product/price creation fails
   - For lesson updates: Revert to previous state if Stripe updates fail
   - Log all errors with sufficient context for debugging

## Stripe API Version

Use Stripe API version '2025-01-27.acacia' as specified in the project overview. Ensure all API calls include this version to maintain consistency.

## Testing Environment Setup

1. **Stripe Test Mode**:
   - Use Stripe test mode for all development and testing
   - Create test Stripe accounts for development
   - Configure environment variables for test mode:
     ```
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_test_...
     ```

2. **Test Data Generation**:
   - Create helper functions to generate test users with Stripe accounts
   - Create sample lessons with various price points
   - Simulate webhook events for testing

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

## OAuth Implementation for Stripe Dashboard Accounts

In addition to the Express onboarding flow, we should implement OAuth for Stripe dashboard accounts to provide a better user experience for users who already have Stripe accounts.

### OAuth Setup Requirements

1. **Register OAuth Application in Stripe**:
   - Go to Stripe Dashboard → Settings → Connect Settings
   - Configure OAuth settings with redirect URI: `https://your-domain.com/api/stripe/connect/oauth-callback`
   - Note the `client_id` for environment variables

2. **Add Environment Variables**:
   ```
   STRIPE_CLIENT_ID=ca_...
   STRIPE_OAUTH_REDIRECT_URI=https://your-domain.com/api/stripe/connect/oauth-callback
   ```

### New API Routes Needed

1. **OAuth Initiation Endpoint**:
   - Create `app/api/stripe/connect/oauth/route.ts`
   - Implement GET handler to generate and return OAuth URL

2. **OAuth Callback Handler**:
   - Create `app/api/stripe/connect/oauth-callback/route.ts`
   - Process OAuth code and exchange for access token
   - Store connected account ID in user profile

### UI Component Updates

Update `StripeConnectButton` component to support both flows:
- Add `useOAuth` prop (default to true)
- Modify connect logic to use appropriate endpoint
- Update button text to indicate connection type

### Testing Requirements

- Test OAuth flow with existing Stripe accounts
- Verify account connection and database updates
- Test both Express and OAuth flows to ensure they work correctly

### Implementation Benefits

- Provides seamless integration for users with existing Stripe accounts
- Reduces onboarding friction
- Creates a more professional user experience
- Gives users flexibility in how they connect
