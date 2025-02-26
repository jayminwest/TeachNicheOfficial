# Integration Testing Guide

This guide outlines the integration testing approach for the Teach Niche platform, with a focus on testing third-party API integrations following our Test Driven Development (TDD) methodology.

## Overview

Integration testing verifies that different parts of the application work together correctly. For Teach Niche, this includes testing interactions between our components and third-party services like Stripe, Supabase, and Mux.

## Test Driven Development Approach

Following our TDD principles, integration tests should be written before implementing features:

1. Write integration tests that define the expected behavior
2. Verify tests fail (Red phase)
3. Implement the feature to make tests pass (Green phase)
4. Refactor while maintaining passing tests (Refactor phase)

## Integration Testing Structure

### Test Organization

Place integration tests in `__tests__` directories adjacent to the code being tested:

```
app/
  api/
    payments/
      __tests__/
        stripe-integration.test.ts
      create-payment.ts
  services/
    supabase/
      __tests__/
        auth-integration.test.ts
      client.ts
```

### Test Environment Setup

Create a dedicated test environment for integration tests:

```typescript
// jest.setup.js
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_TEST_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY;
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY;
process.env.MUX_TOKEN_ID = process.env.MUX_TEST_TOKEN_ID;
process.env.MUX_TOKEN_SECRET = process.env.MUX_TEST_TOKEN_SECRET;
```

## Testing Third-Party API Integrations

### Progressive Testing Approach

For third-party integrations, follow a progressive testing approach:

1. **Start with mocked responses**: Basic tests with mocked API responses
2. **Add actual API tests**: Tests that interact with actual third-party APIs
3. **Test error handling**: Verify how the application handles API errors
4. **Test edge cases**: Verify behavior with unusual or boundary inputs

### Stripe Integration Testing

```typescript
// app/api/payments/__tests__/stripe-integration.test.ts
import { createPaymentIntent } from '../create-payment';
import Stripe from 'stripe';

// Mock tests
describe('Stripe Integration (Mocked)', () => {
  let mockStripe: jest.Mocked<Stripe>;
  
  beforeEach(() => {
    // Mock Stripe client
    mockStripe = {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_test_123',
          client_secret: 'cs_test_123',
          amount: 1000,
          currency: 'usd'
        })
      }
    } as unknown as jest.Mocked<Stripe>;
    
    // Mock the Stripe import
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => mockStripe);
    });
  });
  
  it('creates a payment intent with correct parameters', async () => {
    const result = await createPaymentIntent({
      amount: 1000,
      lessonId: 'lesson-123',
      userId: 'user-123'
    });
    
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
      metadata: {
        lessonId: 'lesson-123',
        userId: 'user-123'
      }
    });
    
    expect(result).toEqual({
      paymentIntentId: 'pi_test_123',
      clientSecret: 'cs_test_123'
    });
  });
  
  it('handles Stripe errors correctly', async () => {
    // Mock a Stripe error
    mockStripe.paymentIntents.create.mockRejectedValue({
      type: 'StripeCardError',
      message: 'Your card was declined'
    });
    
    await expect(createPaymentIntent({
      amount: 1000,
      lessonId: 'lesson-123',
      userId: 'user-123'
    })).rejects.toThrow('Your card was declined');
  });
});

// Actual API tests
describe('Stripe Integration (Actual API)', () => {
  // Only run these tests when explicitly enabled
  if (process.env.RUN_ACTUAL_API_TESTS !== 'true') {
    it('skips actual API tests', () => {
      console.log('Skipping actual Stripe API tests');
    });
    return;
  }
  
  let stripe: Stripe;
  let testPaymentIntentIds: string[] = [];
  
  beforeAll(() => {
    // Create actual Stripe client with test key
    stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
      apiVersion: '2025-01-27'
    });
  });
  
  afterAll(async () => {
    // Clean up test payment intents
    for (const id of testPaymentIntentIds) {
      try {
        await stripe.paymentIntents.cancel(id);
      } catch (error) {
        console.error(`Failed to cancel payment intent ${id}:`, error);
      }
    }
  });
  
  it('creates an actual payment intent', async () => {
    const result = await createPaymentIntent({
      amount: 1000,
      lessonId: 'test-lesson-123',
      userId: 'test-user-123'
    });
    
    expect(result.paymentIntentId).toBeDefined();
    expect(result.clientSecret).toBeDefined();
    
    // Save for cleanup
    testPaymentIntentIds.push(result.paymentIntentId);
    
    // Verify the payment intent was created in Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(result.paymentIntentId);
    expect(paymentIntent.amount).toBe(1000);
    expect(paymentIntent.currency).toBe('usd');
    expect(paymentIntent.metadata.lessonId).toBe('test-lesson-123');
    expect(paymentIntent.metadata.userId).toBe('test-user-123');
  });
  
  it('calculates platform fees correctly', async () => {
    const lessonPrice = 1999; // $19.99
    const result = await createPaymentIntent({
      amount: lessonPrice,
      lessonId: 'test-lesson-fees',
      userId: 'test-user-fees',
      calculateFees: true
    });
    
    // Save for cleanup
    testPaymentIntentIds.push(result.paymentIntentId);
    
    // Verify the payment intent in Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(result.paymentIntentId);
    
    // Verify platform fee calculation (15% of lesson price)
    const platformFee = Math.round(lessonPrice * 0.15);
    expect(paymentIntent.application_fee_amount).toBe(platformFee);
    
    // Verify transfer data for creator payout (85% of lesson price)
    expect(paymentIntent.transfer_data).toBeDefined();
    expect(paymentIntent.transfer_data!.amount).toBe(lessonPrice - platformFee);
  });
});
```

### Supabase Integration Testing

```typescript
// app/services/supabase/__tests__/auth-integration.test.ts
import { signUp, signIn, resetPassword } from '../auth';
import { createClient } from '@supabase/supabase-js';

// Mock tests
describe('Supabase Auth Integration (Mocked)', () => {
  const mockSupabase = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn()
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the createClient function
    jest.mock('@/lib/supabase/client', () => ({
      createClient: jest.fn().mockReturnValue(mockSupabase)
    }));
  });
  
  it('signs up a new user', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    });
    
    const result = await signUp('test@example.com', 'password123');
    
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result.user).toEqual({ id: 'user-123', email: 'test@example.com' });
    expect(result.error).toBeNull();
  });
  
  it('handles signup errors', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' }
    });
    
    const result = await signUp('existing@example.com', 'password123');
    
    expect(result.user).toBeNull();
    expect(result.error).toEqual({ message: 'Email already registered' });
  });
});

// Actual API tests
describe('Supabase Auth Integration (Actual API)', () => {
  // Only run these tests when explicitly enabled
  if (process.env.RUN_ACTUAL_API_TESTS !== 'true') {
    it('skips actual API tests', () => {
      console.log('Skipping actual Supabase API tests');
    });
    return;
  }
  
  let supabase: ReturnType<typeof createClient>;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  let testUserId: string | undefined;
  
  beforeAll(() => {
    // Create actual Supabase client with test credentials
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY!
    );
  });
  
  afterAll(async () => {
    // Clean up test user
    if (testUserId && process.env.SUPABASE_SERVICE_KEY) {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      try {
        await adminSupabase.auth.admin.deleteUser(testUserId);
      } catch (error) {
        console.error('Failed to delete test user:', error);
      }
    }
  });
  
  it('signs up a new user with actual Supabase', async () => {
    const result = await signUp(testEmail, testPassword);
    
    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user!.email).toBe(testEmail);
    
    // Save user ID for cleanup
    testUserId = result.user!.id;
  });
  
  it('signs in an existing user', async () => {
    // Skip if signup failed
    if (!testUserId) {
      console.log('Skipping signin test because signup failed');
      return;
    }
    
    const result = await signIn(testEmail, testPassword);
    
    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user!.email).toBe(testEmail);
  });
  
  it('handles invalid credentials', async () => {
    const result = await signIn(testEmail, 'WrongPassword123!');
    
    expect(result.error).not.toBeNull();
    expect(result.user).toBeNull();
    expect(result.error!.message).toContain('Invalid login credentials');
  });
});
```

### Mux Integration Testing

```typescript
// app/services/mux/__tests__/video-integration.test.ts
import { createUpload, getAsset } from '../video';
import Mux from '@mux/mux-node';

// Mock tests
describe('Mux Video Integration (Mocked)', () => {
  const mockMux = {
    Video: {
      Uploads: {
        create: jest.fn()
      },
      Assets: {
        get: jest.fn()
      }
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Mux import
    jest.mock('@mux/mux-node', () => {
      return {
        default: jest.fn().mockReturnValue(mockMux)
      };
    });
  });
  
  it('creates a direct upload', async () => {
    mockMux.Video.Uploads.create.mockResolvedValue({
      id: 'upload-123',
      url: 'https://storage.mux.com/upload-123',
      status: 'waiting'
    });
    
    const result = await createUpload('test-video');
    
    expect(mockMux.Video.Uploads.create).toHaveBeenCalledWith({
      new_asset_settings: {
        playback_policy: 'signed',
        passthrough: 'test-video'
      },
      cors_origin: expect.any(String)
    });
    
    expect(result).toEqual({
      uploadId: 'upload-123',
      uploadUrl: 'https://storage.mux.com/upload-123'
    });
  });
  
  it('gets asset details', async () => {
    mockMux.Video.Assets.get.mockResolvedValue({
      id: 'asset-123',
      playback_ids: [{ id: 'playback-123', policy: 'signed' }],
      status: 'ready',
      duration: 120.5
    });
    
    const result = await getAsset('asset-123');
    
    expect(mockMux.Video.Assets.get).toHaveBeenCalledWith('asset-123');
    
    expect(result).toEqual({
      id: 'asset-123',
      playbackId: 'playback-123',
      status: 'ready',
      duration: 120.5
    });
  });
});

// Actual API tests
describe('Mux Video Integration (Actual API)', () => {
  // Only run these tests when explicitly enabled
  if (process.env.RUN_ACTUAL_API_TESTS !== 'true') {
    it('skips actual API tests', () => {
      console.log('Skipping actual Mux API tests');
    });
    return;
  }
  
  let mux: Mux;
  let testUploadId: string;
  let testAssetId: string;
  
  beforeAll(() => {
    // Create actual Mux client with test credentials
    mux = new Mux({
      tokenId: process.env.MUX_TEST_TOKEN_ID!,
      tokenSecret: process.env.MUX_TEST_TOKEN_SECRET!
    });
  });
  
  afterAll(async () => {
    // Clean up test assets
    if (testAssetId) {
      try {
        await mux.Video.Assets.del(testAssetId);
      } catch (error) {
        console.error('Failed to delete test asset:', error);
      }
    }
  });
  
  it('creates an actual direct upload', async () => {
    const result = await createUpload('test-integration-video');
    
    expect(result.uploadId).toBeDefined();
    expect(result.uploadUrl).toBeDefined();
    
    // Save for later tests and cleanup
    testUploadId = result.uploadId;
    
    // Verify the upload was created in Mux
    const upload = await mux.Video.Uploads.get(testUploadId);
    expect(upload.id).toBe(testUploadId);
    expect(upload.status).toBe('waiting');
  });
  
  // Note: Testing the complete upload flow would require actually uploading a file,
  // which might be too complex for a unit test. This could be better suited for E2E tests.
  
  it('gets asset details from Mux', async () => {
    // Create a test asset first (this would normally happen after upload)
    const asset = await mux.Video.Assets.create({
      input: [{ url: 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4' }],
      playback_policy: 'public'
    });
    
    testAssetId = asset.id;
    
    // Wait for asset to be ready (this might take some time)
    let readyAsset;
    for (let i = 0; i < 10; i++) {
      readyAsset = await mux.Video.Assets.get(testAssetId);
      if (readyAsset.status === 'ready') break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (readyAsset?.status !== 'ready') {
      console.warn('Asset not ready yet, test might fail');
    }
    
    // Test our getAsset function
    const result = await getAsset(testAssetId);
    
    expect(result.id).toBe(testAssetId);
    expect(result.playbackId).toBeDefined();
    expect(result.status).toBeDefined();
  });
});
```

## Running Integration Tests

### Basic Commands

```bash
# Run all tests (mocked by default)
npm test

# Run tests for a specific service
npm test -- --testPathPattern=supabase

# Run tests with actual API calls
RUN_ACTUAL_API_TESTS=true npm test -- --testPathPattern=integration

# Run in watch mode
npm test -- --watch
```

### CI/CD Integration

Configure your CI/CD pipeline to run integration tests:

```yaml
# Example GitHub Actions workflow
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Run mocked integration tests
        run: npm test -- --testPathPattern=integration
      - name: Run actual API integration tests
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/dev'
        run: RUN_ACTUAL_API_TESTS=true npm test -- --testPathPattern=integration
        env:
          NEXT_PUBLIC_SUPABASE_TEST_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_TEST_URL }}
          NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY }}
          STRIPE_TEST_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          MUX_TEST_TOKEN_ID: ${{ secrets.MUX_TEST_TOKEN_ID }}
          MUX_TEST_TOKEN_SECRET: ${{ secrets.MUX_TEST_TOKEN_SECRET }}
```

## Test Data Management

### Test Data Principles

1. **Isolation**: Each test should create and clean up its own data
2. **Deterministic**: Tests should not depend on existing data
3. **Realistic**: Test data should resemble real-world data
4. **Minimal**: Use only the data needed for the test

### Creating Test Data

```typescript
// Helper function to create a test user
async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'SecurePassword123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) throw error;
  
  return {
    id: data.user!.id,
    email,
    password
  };
}

// Helper function to clean up test data
async function deleteTestUser(id: string) {
  if (!process.env.SUPABASE_SERVICE_KEY) return;
  
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  await adminSupabase.auth.admin.deleteUser(id);
}

// Use in tests
it('user can update profile', async () => {
  // Create test user
  const user = await createTestUser();
  
  try {
    // Run test
    const result = await updateProfile(user.id, {
      name: 'Test User',
      bio: 'This is a test bio'
    });
    
    expect(result.error).toBeNull();
    expect(result.data.name).toBe('Test User');
  } finally {
    // Clean up
    await deleteTestUser(user.id);
  }
});
```

## Best Practices

1. **Write Tests First**: Follow TDD principles and write tests before implementing features
2. **Mock by Default**: Use mocks for most tests to keep them fast and reliable
3. **Test Actual APIs**: Include tests that verify actual third-party API integration
4. **Clean Up Test Data**: Always clean up data created during tests
5. **Test Error Handling**: Verify the application handles API errors gracefully
6. **Keep Tests Independent**: Each test should run independently of others
7. **Use Realistic Data**: Test with data that resembles real-world usage
8. **Secure API Keys**: Never commit API keys to the repository
9. **Conditional Execution**: Make actual API tests conditional to avoid unnecessary API calls
10. **Comprehensive Coverage**: Test all aspects of third-party integrations

## Troubleshooting

### Common Issues

1. **API Rate Limiting**: Use test accounts with higher rate limits or reduce test frequency
2. **Authentication Issues**: Verify API keys and credentials are correct
3. **Test Data Conflicts**: Ensure tests use unique identifiers to avoid conflicts
4. **Timing Issues**: Add appropriate waits for asynchronous operations
5. **Environment Variables**: Verify all required environment variables are set

### Debugging Tips

1. **Console Logging**: Add temporary logs to see API responses
2. **API Documentation**: Refer to third-party API documentation for error codes
3. **Test in Isolation**: Run problematic tests in isolation
4. **Check API Dashboards**: Review third-party service dashboards for issues
5. **Verify Test Environment**: Ensure test environment is properly configured

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Testing Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD and third-party API testing |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
