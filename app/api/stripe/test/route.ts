import { NextResponse } from 'next/server';
import { getStripe } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the Stripe instance
    const stripe = getStripe();
    
    // Test if we can access the Stripe API
    const testData = {
      apiVersion: stripe.getApiField('version'),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };
    
    return NextResponse.json({
      status: 'ok',
      message: 'Stripe API connection successful',
      data: testData
    });
  } catch (error) {
    console.error('Stripe API test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Stripe API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
