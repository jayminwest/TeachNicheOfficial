import { NextResponse } from 'next/server';
import { getStripe } from '@/app/services/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stripe = getStripe();
    
    // Create a test account
    const account = await (stripe.accounts as Stripe.AccountsResource).create({
      type: 'express',
      email: 'test@example.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });
    
    console.log('Test account created:', account.id);
    
    // Create an account link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/profile',
      return_url: 'http://localhost:3000/profile',
      type: 'account_onboarding'
    });
    
    console.log('Test account link created:', accountLink);
    
    return NextResponse.json({
      success: true,
      accountId: account.id,
      url: accountLink.url,
      message: 'Test account and link created successfully'
    });
  } catch (error) {
    console.error('Test link creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
