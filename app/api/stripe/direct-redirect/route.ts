import { NextResponse } from 'next/server';
import { getStripe } from '@/app/services/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectType = searchParams.get('type') || 'dashboard';
    
    // Create a test account for demonstration
    const stripe = getStripe();
    const account = await (stripe.accounts as Stripe.AccountsResource).create({
      type: 'express',
      email: `test-${Date.now()}@example.com`,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });
    
    console.log('Created test account:', account.id);
    
    // Create an account link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/profile',
      return_url: 'http://localhost:3000/profile',
      type: 'account_onboarding'
    });
    
    console.log('Created account link:', accountLink.url);
    
    // Redirect directly to the Stripe URL
    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error('Direct redirect error:', error);
    
    // If there's an error, redirect to Stripe dashboard as fallback
    return NextResponse.redirect('https://dashboard.stripe.com/');
  }
}
