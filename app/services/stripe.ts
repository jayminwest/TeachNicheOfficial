import Stripe from 'stripe';

// Error handling types
export type StripeErrorCode = 
  | 'account_mismatch'
  | 'incomplete_onboarding'
  | 'unauthorized'
  | 'missing_account'
  | 'profile_verification_failed'
  | 'update_failed'
  | 'callback_failed';

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
  connectType: 'standard' | 'express';
  platformFeePercent: number;
  supportedCountries: string[];
  defaultCurrency: string;
  processingFeePercent: number;
  processingFeeFixed: number;
}

export interface StripeAccountStatus {
  isComplete: boolean;
  missingRequirements: string[];
  pendingVerification: boolean;
}

export interface ConnectSessionOptions {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type: 'account_onboarding' | 'account_update';
}

export interface AccountVerificationResult {
  verified: boolean;
  accountId: string;
  status: StripeAccountStatus;
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
  apiVersion: '2024-12-18.acacia',
  connectType: 'express', // Changed from 'standard' to 'express'
  platformFeePercent: Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '15'),
  supportedCountries: (process.env.STRIPE_SUPPORTED_COUNTRIES || 'US,CA,GB,AU,NZ,SG,HK,JP,EU').split(','),
  defaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY || 'usd',
  processingFeePercent: Number(process.env.STRIPE_PROCESSING_FEE_PERCENT || '2.9'),
  processingFeeFixed: Number(process.env.STRIPE_PROCESSING_FEE_FIXED || '0.30')
};

export const stripeErrorMessages: Record<StripeErrorCode, string> = {
  account_mismatch: 'Account verification failed',
  incomplete_onboarding: 'Please complete your Stripe onboarding',
  unauthorized: 'You must be logged in',
  missing_account: 'No Stripe account found',
  profile_verification_failed: 'Profile verification failed',
  update_failed: 'Failed to update account status',
  callback_failed: 'Connection process failed'
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
      accounts: {
        retrieve: jest.fn().mockResolvedValue({
          details_submitted: true,
          payouts_enabled: true,
          charges_enabled: true,
          requirements: { currently_due: [], pending_verification: [] }
        }),
        create: jest.fn().mockResolvedValue({
          id: 'acct_test123',
          details_submitted: false,
          payouts_enabled: false,
          charges_enabled: false
        })
      },
      accountLinks: {
        create: jest.fn().mockResolvedValue({
          url: 'https://connect.stripe.com/setup/test'
        })
      },
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({ type: 'test.event', data: { object: {} } })
      },
      products: {
        create: jest.fn().mockResolvedValue({ id: 'prod_test123' })
      },
      prices: {
        create: jest.fn().mockResolvedValue({ id: 'price_test123' })
      }
    };
  }
  
  if (!stripe) {
    throw new Error('Stripe can only be accessed on the server side');
  }
  return stripe;
};


// Helper functions and utilities
export const getAccountStatus = async (accountId: string): Promise<StripeAccountStatus> => {
  const account = await getStripe().accounts.retrieve(accountId);
  
  return {
    isComplete: !!(account.details_submitted && account.payouts_enabled && account.charges_enabled),
    missingRequirements: account.requirements?.currently_due || [],
    pendingVerification: Array.isArray(account.requirements?.pending_verification) && account.requirements.pending_verification.length > 0
  };
};

export const createConnectSession = async (options: ConnectSessionOptions) => {
  try {
    console.log('Creating Stripe account link with options:', {
      account: options.accountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: options.type,
    });
    
    const stripe = getStripe();
    
    // Validate URLs to ensure they're absolute
    const validateUrl = (url: string) => {
      try {
        new URL(url);
        return url;
      } catch (e) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      }
    };
    
    const session = await stripe.accountLinks.create({
      account: options.accountId,
      refresh_url: validateUrl(options.refreshUrl),
      return_url: validateUrl(options.returnUrl),
      type: options.type,
    });
    
    console.log('Account link created successfully:', session);
    return session;
  } catch (error) {
    console.error('Stripe Connect session creation failed:', error);
    console.error('Error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : 'Unknown error type');
    
    throw new StripeError(
      'callback_failed',
      error instanceof Error ? error.message : 'Failed to create Connect session'
    );
  }
};

// Calculate gross amount that, after Stripe fees, will yield the desired net amount
export const calculateGrossAmount = (
  netAmount: number, 
  currency: string = stripeConfig.defaultCurrency
): number => {
  // Default Stripe fee is 2.9% + $0.30 for USD
  const percentageFee = stripeConfig.processingFeePercent / 100;
  const fixedFee = stripeConfig.processingFeeFixed;
  
  // Formula: (Net Amount + Fixed Fee) / (1 - Percentage Fee)
  const grossAmount = (netAmount + fixedFee) / (1 - percentageFee);
  
  // Round to 2 decimal places
  return Math.round(grossAmount * 100) / 100;
};

// Calculate the fee amount for a given net amount
export const calculateFeeAmount = (
  netAmount: number,
  currency: string = stripeConfig.defaultCurrency
): number => {
  const grossAmount = calculateGrossAmount(netAmount, currency);
  return Math.round((grossAmount - netAmount) * 100) / 100;
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
      'callback_failed',
      err instanceof Error ? err.message : 'Invalid webhook signature'
    );
  }
};

import { TypedSupabaseClient } from '@/app/lib/types/supabase';

// Helper for creating Stripe products for lessons
export const createProductForLesson = async (
  lesson: { id: string; title: string; description?: string },
  stripeClient = getStripe()
) => {
  try {
    const product = await stripeClient.products.create({
      name: lesson.title,
      description: lesson.description || undefined,
      metadata: {
        lesson_id: lesson.id
      }
    });
    
    return product.id;
  } catch (error) {
    console.error('Failed to create Stripe product:', error);
    throw new StripeError(
      'callback_failed',
      error instanceof Error ? error.message : 'Failed to create Stripe product'
    );
  }
};

// Helper for creating Stripe prices
export const createPriceForProduct = async (
  productId: string,
  amount: number,
  currency = stripeConfig.defaultCurrency,
  stripeClient = getStripe()
) => {
  try {
    const price = await stripeClient.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
    });
    
    return price.id;
  } catch (error) {
    console.error('Failed to create Stripe price:', error);
    throw new StripeError(
      'callback_failed',
      error instanceof Error ? error.message : 'Failed to create Stripe price'
    );
  }
};

// Helper to check if a user can create paid lessons
export const canCreatePaidLessons = async (
  userId: string,
  supabaseClient: TypedSupabaseClient
): Promise<boolean> => {
  try {
    // Get profile with Stripe account ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_account_id) {
      return false;
    }

    // If we already know onboarding is complete, return true
    if (profile.stripe_onboarding_complete) {
      return true;
    }

    // Otherwise check with Stripe
    const status = await getAccountStatus(profile.stripe_account_id);
    return status.isComplete;
  } catch (error) {
    console.error('Error checking paid lesson capability:', error);
    return false;
  }
};

export const verifyConnectedAccount = async (
  userId: string,
  accountId: string,
  supabaseClient: TypedSupabaseClient
): Promise<AccountVerificationResult> => {
  try {
    // Get profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch failed:', profileError);
      throw new StripeError('profile_verification_failed', 'Failed to fetch profile');
    }

    if (!profile?.stripe_account_id) {
      throw new StripeError('missing_account', 'No Stripe account found');
    }

    if (profile.stripe_account_id !== accountId) {
      throw new StripeError('account_mismatch', 'Account verification failed');
    }

    const status = await getAccountStatus(accountId);

    return {
      verified: true,
      accountId,
      status
    };
  } catch (error) {
    if (error instanceof StripeError) {
      throw error;
    }
    console.error('Account verification failed:', error);
    throw new StripeError(
      'profile_verification_failed',
      error instanceof Error ? error.message : 'Account verification failed'
    );
  }
};

// Export constants for backward compatibility
export const SUPPORTED_COUNTRIES = stripeConfig.supportedCountries;
export const DEFAULT_CURRENCY = stripeConfig.defaultCurrency;
