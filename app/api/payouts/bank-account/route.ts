import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { Database } from '@/types/database';
import { stripeConfig } from '@/app/services/stripe';

// Initialize Stripe
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion,
});

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { userId, accountNumber, routingNumber, accountHolderName, accountType, country } = body;
    
    // Validate the request
    if (!userId || !accountNumber || !routingNumber || !accountHolderName || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const auth = getAuth()<Database>({ cookies });
    
    // Get the current user
    const { data: { session } } = await firebaseAuth.getSession();
    
    if (!session || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
        last_four: bankAccount.bank_account?.last4 || '0000',
        bank_name: bankAccount.bank_account?.bank_name || null,
        account_holder_name: accountHolderName,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'creator_id',
      });
    
    if (error) {
      console.error('Error storing bank account:', error);
      return NextResponse.json(
        { error: 'Failed to store bank account information' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Bank account set up successfully',
      last_four: bankAccount.bank_account?.last4 || '0000'
    });
  } catch (error) {
    console.error('Error setting up bank account:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to set up bank account'
      },
      { status: 500 }
    );
  }
}
