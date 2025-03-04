import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create a new Stripe instance directly with the API key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-01-27.acacia'
    });
    
    // Try to fetch account balance as a simple test
    const balance = await stripe.balance.retrieve();
    
    return NextResponse.json({
      success: true,
      message: 'Stripe API key is valid',
      balanceAvailable: balance.available.map(b => ({
        amount: b.amount,
        currency: b.currency
      }))
    });
  } catch (error) {
    console.error('Stripe key test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
