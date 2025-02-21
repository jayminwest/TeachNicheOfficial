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
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  apiVersion: '2025-01-27.acacia',
  connectType: 'standard',
  platformFeePercent: Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10'),
  supportedCountries: (process.env.STRIPE_SUPPORTED_COUNTRIES || 'US,CA,GB,AU,NZ,SG,HK,JP,EU').split(','),
  defaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY || 'usd'
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
export const stripe = typeof window === 'undefined' 
  ? new Stripe(stripeConfig.secretKey, {
      apiVersion: stripeConfig.apiVersion,
      typescript: true,
    })
  : null;

// Helper to ensure stripe instance exists (server-side only)
export const getStripe = () => {
  if (!stripe) {
    throw new Error('Stripe can only be accessed on the server side');
  }
  return stripe;
};

// Helper functions
export const calculateFees = (amount: number) => {
  const platformFee = Math.round(amount * (stripeConfig.platformFeePercent / 100));
  const creatorEarnings = amount - platformFee;
  
  return {
    platformFee,
    creatorEarnings,
    feePercentage: stripeConfig.platformFeePercent
  };
};

// Helper functions and utilities
export const getAccountStatus = async (accountId: string): Promise<StripeAccountStatus> => {
  const account = await getStripe().accounts.retrieve(accountId);
  
  return {
    isComplete: !!(account.details_submitted && account.payouts_enabled && account.charges_enabled),
    missingRequirements: account.requirements?.currently_due || [],
    pendingVerification: account.requirements?.pending_verification?.length > 0
  };
};

export const createConnectSession = async (options: ConnectSessionOptions) => {
  try {
    const session = await getStripe().accountLinks.create({
      account: options.accountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: options.type,
    });
    
    return session;
  } catch (error) {
    console.error('Stripe Connect session creation failed:', error);
    throw new StripeError(
      'callback_failed',
      error instanceof Error ? error.message : 'Failed to create Connect session'
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
      'callback_failed',
      err instanceof Error ? err.message : 'Invalid webhook signature'
    );
  }
};

import { TypedSupabaseClient } from '@/lib/types/supabase';

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
