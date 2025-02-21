import Stripe from 'stripe';

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

// Validate and load configuration
const validateConfig = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
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

// Initialize Stripe client
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion,
  typescript: true,
});

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

// Export constants for backward compatibility
export const SUPPORTED_COUNTRIES = stripeConfig.supportedCountries;
export const DEFAULT_CURRENCY = stripeConfig.defaultCurrency;
