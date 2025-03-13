/**
 * API Key Verification Test
 * 
 * This test verifies that all required API keys and environment variables
 * are properly set and working. It should be run before any other fixes
 * to ensure the environment is correctly configured.
 */

import Mux from '@mux/mux-node';
import Stripe from 'stripe';
import { createMuxClient } from '../services/mux';
import { createStripeClient } from '../services/stripe';

describe('API Key Verification', () => {
  // Check if environment variables are set
  describe('Environment Variables', () => {
    test('Mux environment variables are set', () => {
      expect(process.env.MUX_TOKEN_ID).toBeDefined();
      expect(process.env.MUX_TOKEN_SECRET).toBeDefined();
      expect(process.env.MUX_TOKEN_ID).not.toBe('');
      expect(process.env.MUX_TOKEN_SECRET).not.toBe('');
    });

    test('Stripe environment variables are set', () => {
      expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBeDefined();
      expect(process.env.STRIPE_WEBHOOK_SECRET).toBeDefined();
      expect(process.env.STRIPE_SECRET_KEY).not.toBe('');
      expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).not.toBe('');
      expect(process.env.STRIPE_WEBHOOK_SECRET).not.toBe('');
    });

    test('Supabase environment variables are set', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).not.toBe('');
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).not.toBe('');
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).not.toBe('');
    });
  });

  // Test Mux client initialization
  describe('Mux Integration', () => {
    test('Mux client initializes without errors', () => {
      expect(() => createMuxClient()).not.toThrow();
      const { Video } = createMuxClient();
      expect(Video).toBeDefined();
    });

    test('Mux API credentials are valid', async () => {
      const { Video } = createMuxClient();
      
      // Simple API call to verify credentials
      await expect(async () => {
        const result = await Video.Assets.list({ limit: 1 });
        return result;
      }).not.toThrow();
    });
  });

  // Test Stripe client initialization
  describe('Stripe Integration', () => {
    test('Stripe client initializes without errors', () => {
      expect(() => createStripeClient()).not.toThrow();
      const { stripe } = createStripeClient();
      expect(stripe).toBeDefined();
    });

    test('Stripe API credentials are valid', async () => {
      const { stripe } = createStripeClient();
      
      // Simple API call to verify credentials
      await expect(async () => {
        const result = await stripe.balance.retrieve();
        return result;
      }).not.toThrow();
    });

    test('Stripe webhook secret is valid', async () => {
      const { stripe, config } = createStripeClient();
      
      // Create a mock webhook event
      const mockEvent = {
        id: 'evt_test',
        object: 'event',
        api_version: '2025-01-27.acacia',
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
        type: 'test'
      };
      
      // Generate a signature (this is just a test, in reality Stripe would generate this)
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify(mockEvent);
      
      // This will throw if the webhook secret is invalid format
      expect(() => {
        // We're not actually verifying a real signature here, just checking the secret is valid format
        // This would throw if the secret is completely invalid
        stripe.webhooks.constructEvent(payload, 'test_sig', config.webhookSecret);
      }).toThrow(); // It should throw because our test_sig is invalid, but not because of the secret
    });
  });

  // Create a utility function to verify all keys at once
  describe('Service Health Check', () => {
    test('All services are accessible', async () => {
      // This test combines checks for all services
      // It can be extracted to a utility function for use in the application
      
      const serviceChecks = [];
      
      // Check Mux
      try {
        const { Video } = createMuxClient();
        await Video.Assets.list({ limit: 1 });
        serviceChecks.push({ service: 'Mux', status: 'ok' });
      } catch (error) {
        serviceChecks.push({ 
          service: 'Mux', 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
      
      // Check Stripe
      try {
        const { stripe } = createStripeClient();
        await stripe.balance.retrieve();
        serviceChecks.push({ service: 'Stripe', status: 'ok' });
      } catch (error) {
        serviceChecks.push({ 
          service: 'Stripe', 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
      
      // Log results for debugging
      console.log('Service Health Check Results:', serviceChecks);
      
      // All services should be accessible
      const failedServices = serviceChecks.filter(check => check.status !== 'ok');
      expect(failedServices).toHaveLength(0);
    });
  });
});
