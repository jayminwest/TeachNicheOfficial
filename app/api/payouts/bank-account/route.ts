import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { stripeConfig } from '@/app/services/stripe';

// Initialize Stripe
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion,
});

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { userId, accountNumber, routingNumber, accountHolderName, accountType, country } = body;
    
    // Validate the request
    if (!userId || !accountNumber || !routingNumber || !accountHolderName || !accountType) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Create a bank account token with Stripe
    const bankAccount = await stripe.tokens.create({
      bank_account: {
        country: country || 'US',
        currency: 'usd',
        account_holder_name: accountHolderName,
        account_holder_type: 'individual',
        routing_number: routingNumber,
        account_number: accountNumber,
        account_type: accountType,
      },
    });
    
    // Store the bank account token in the database
    const { error } = await supabase
      .from('creator_payout_methods')
      .upsert({
        creator_id: userId,
        bank_account_token: bankAccount.id,
        last_four: bankAccount.bank_account?.last4 || '',
        country: country || 'US',
        currency: 'usd',
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error storing bank account:', error);
      return NextResponse.json(
        { error: { message: 'Failed to store bank account information' } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Bank account set up successfully',
      last_four: bankAccount.bank_account?.last4 || ''
    });
  } catch (error) {
    console.error('Error setting up bank account:', error);
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to set up bank account'
        } 
      },
      { status: 500 }
    );
  }
}
