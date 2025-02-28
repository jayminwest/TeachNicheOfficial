import Stripe from 'stripe';
import { DatabaseService } from './database/interface';

// Error handling types
export type StripeErrorCode = 
  | 'payment_failed'
  | 'unauthorized'
  | 'invalid_request'
  | 'webhook_error';

export class StripeError extends Error {
  constructor(
    public code: StripeErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

// Stripe configuration interface
export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  apiVersion: '2025-01-27.acacia';
  platformFeePercent: number;
  defaultCurrency: string;
  minimumPayoutAmount: number;
  payoutSchedule: 'weekly' | 'monthly';
  supportedCountries: string[];
  // Add mock properties for testing
  mock?: boolean;
}

export interface PaymentMetadata {
  creatorId: string;
  lessonId: string;
  purchaseId: string;
}


// Validate and load configuration
const validateConfig = () => {
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  // Only validate on server side
  if (typeof window === 'undefined') {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
  }
  
  // Always validate public key as it's needed on client
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
};

validateConfig();

// Central configuration object
export const stripeConfig: StripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_tests',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_tests',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy_key_for_tests',
  apiVersion: '2025-01-27.acacia',
  platformFeePercent: Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '15'),
  defaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY || 'usd',
  minimumPayoutAmount: Number(process.env.STRIPE_MINIMUM_PAYOUT_AMOUNT || '100'),
  payoutSchedule: (process.env.STRIPE_PAYOUT_SCHEDULE || 'weekly') as 'weekly' | 'monthly',
  supportedCountries: (process.env.STRIPE_SUPPORTED_COUNTRIES || 'US,CA,GB,AU').split(',')
};

export const stripeErrorMessages: Record<StripeErrorCode, string> = {
  payment_failed: 'Payment processing failed',
  unauthorized: 'You must be logged in',
  invalid_request: 'Invalid payment request',
  webhook_error: 'Webhook processing failed'
};

// Initialize Stripe client (server-side only)
export const stripe = typeof window === 'undefined' && process.env.NODE_ENV !== 'test'
  ? new Stripe(stripeConfig.secretKey, {
      apiVersion: stripeConfig.apiVersion,
      typescript: true,
    })
  : null;

// Helper to ensure stripe instance exists (server-side only)
export const getStripe = () => {
  if (process.env.NODE_ENV === 'test') {
    // Return mock for tests
    return {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_test',
          client_secret: 'pi_test_secret'
        })
      },
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({ type: 'test.event', data: { object: {} } })
      }
    };
  }
  
  if (!stripe) {
    throw new Error('Stripe can only be accessed on the server side');
  }
  return stripe;
};

/**
 * Creates a payment intent for a lesson purchase
 * 
 * @param amount Amount in cents
 * @param metadata Payment metadata including creator and lesson IDs
 * @param currency Currency code (default: from config)
 * @returns Payment intent with client secret
 */
export const createPaymentIntent = async (
  amount: number,
  metadata: PaymentMetadata,
  currency: string = stripeConfig.defaultCurrency
) => {
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency,
      metadata: {
        creatorId: metadata.creatorId,
        lessonId: metadata.lessonId,
        purchaseId: metadata.purchaseId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw new StripeError(
      'payment_failed',
      error instanceof Error ? error.message : 'Failed to create payment'
    );
  }
};


export const verifyStripeWebhook = (
  payload: string | Buffer,
  signature: string,
  endpointSecret: string = stripeConfig.webhookSecret
) => {
  try {
    return getStripe().webhooks.constructEvent(
      payload,
      signature,
      endpointSecret
    );
  } catch (err) {
    throw new StripeError(
      'webhook_error',
      err instanceof Error ? err.message : 'Invalid webhook signature'
    );
  }
};

// Export constants for backward compatibility
export const DEFAULT_CURRENCY = stripeConfig.defaultCurrency;

/**
 * Creates a Stripe Connect account link for onboarding
 */
export const createConnectSession = async ({
  accountId,
  refreshUrl,
  returnUrl,
  type = 'account_onboarding'
}: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: 'account_onboarding' | 'account_update';
}) => {
  try {
    const stripe = getStripe();
    const accountLink = await (stripe as Stripe).accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type,
    });
    
    return accountLink;
  } catch (error) {
    console.error('Failed to create account link:', error);
    throw new StripeError(
      'invalid_request',
      error instanceof Error ? error.message : 'Failed to create account link'
    );
  }
};

/**
 * Gets the status of a Stripe Connect account
 */
export const getAccountStatus = async (accountId: string) => {
  try {
    const stripe = getStripe();
    const account = await (stripe as Stripe).accounts.retrieve(accountId);
    
    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      isComplete: account.charges_enabled && account.payouts_enabled && account.details_submitted,
      requirements: account.requirements,
    };
  } catch (error) {
    console.error('Failed to get account status:', error);
    throw new StripeError(
      'invalid_request',
      error instanceof Error ? error.message : 'Failed to get account status'
    );
  }
};

/**
 * Verifies a connected account belongs to the user
 */
export const verifyConnectedAccount = async (
  userId: string,
  accountId: string,
  databaseService: DatabaseService
) => {
  try {
    // Verify the account exists and belongs to this user
    const profiles = await databaseService.list('profiles', { id: userId });
    
    // Check if we got results
    let profile = profiles && profiles.length > 0 ? profiles[0] : null;
    
    if (!profile?.stripe_account_id || profile.stripe_account_id !== accountId) {
      return { verified: false, status: { isComplete: false } };
    }
    
    // Get account status
    const status = await getAccountStatus(accountId);
    
    return { verified: true, status };
  } catch (error) {
    console.error('Failed to verify connected account:', error);
    return { verified: false, status: { isComplete: false } };
  }
};
