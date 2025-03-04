import { NextResponse } from 'next/server';
import { stripeConfig } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return a sanitized version of the config (no secrets)
    const safeConfig = {
      connectType: stripeConfig.connectType,
      apiVersion: stripeConfig.apiVersion,
      platformFeePercent: stripeConfig.platformFeePercent,
      supportedCountries: stripeConfig.supportedCountries,
      defaultCurrency: stripeConfig.defaultCurrency,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    };
    
    return NextResponse.json({
      status: 'ok',
      config: safeConfig
    });
  } catch (error) {
    console.error('Stripe config debug error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to get Stripe configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
