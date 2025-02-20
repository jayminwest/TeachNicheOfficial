# Stripe Testing Plan

## 1. Test File Organization
```typescript
__tests__/
  components/
    ui/
      stripe-connect-button.test.tsx
  payment/
    checkout.test.tsx
    webhook-handlers.test.tsx
    stripe-utils.test.tsx
```

## 2. Key Testing Areas

### A. Stripe Connect Button Tests
```typescript
describe('StripeConnectButton', () => {
  describe('rendering', () => {
    it('renders connect button when not connected')
    it('renders connected status when account exists')
    it('shows loading state during connection')
  })

  describe('interactions', () => {
    it('initiates oauth flow when clicked')
    it('handles connection errors appropriately')
    it('updates UI after successful connection')
  })
})
```

### B. Checkout Flow Tests
```typescript
describe('LessonCheckout', () => {
  describe('critical path', () => {
    it('creates checkout session successfully') ✓
    it('redirects to Stripe Checkout')
    it('handles successful payment completion')
    it('handles cancelled payment appropriately')
  })

  describe('error handling', () => {
    it('handles invalid price errors')
    it('handles network failures')
    it('handles session creation failures')
  })
})
```

## 3. Mock Setup
```typescript
// In __tests__/setup/stripe-mocks.ts
export const mockStripeClient = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  accounts: {
    create: jest.fn(),
  },
};

export const mockCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test',
};
```

## 4. Test Utilities
```typescript
// In __tests__/test-utils.tsx
export const renderWithStripe = (
  ui: React.ReactElement,
  options = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers stripePromise={loadStripe('test_key')}>
        {children}
      </Providers>
    ),
    ...options,
  });
};
```

## 5. Integration Tests
```typescript
describe('Payment Integration', () => {
  it('completes full payment flow', async () => {
    // Test end-to-end payment flow
    // Including webhook handling
  });

  it('handles international payments correctly', async () => {
    // Test different currencies
    // Test different country requirements
  });
});
```

## 6. Webhook Testing
```typescript
describe('Stripe Webhooks', () => {
  it('processes successful payment webhooks')
  it('handles refund webhooks')
  it('manages subscription lifecycle events')
  it('validates webhook signatures')
});
```

## 7. Error Scenarios to Test
- Invalid card numbers
- Insufficient funds
- 3D Secure authentication failures
- Network timeouts
- Currency conversion issues
- Account verification failures
- Webhook signature mismatches

## 8. Test Environment Setup
```typescript
// In jest.setup.js
process.env.STRIPE_SECRET_KEY = 'sk_test_...';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_...';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_...';
```

## 9. Continuous Integration
- Add specific Stripe-related test jobs to CI pipeline
- Use Stripe test mode keys in CI environment
- Run payment integration tests in staging environment

## 10. Testing Best Practices
- Use Stripe test mode and test cards
- Mock external Stripe API calls in unit tests
- Use real API calls in integration tests
- Test both successful and failure scenarios
- Verify webhook signature validation
- Test currency handling and conversions
- Ensure proper error messages are displayed to users
