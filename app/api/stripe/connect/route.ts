import { stripe, getStripe } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // First try cookie-based session
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.user) {
    return { user: session.user };
  }

  // If no cookie session, check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: error || new Error('No user found') };
    }
    
    return { user };
  }

  return { error: new Error('No session found') };
}

export async function POST(request: Request) {
  try {
    console.log('Starting Stripe Connect process...');
    
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError) {
      console.error('Authentication error:', authError);
      console.error('Auth error details:', authError.message);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Request body parse error:', e);
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: e instanceof Error ? e.message : 'Unknown error'
      }, { status: 400 });
    }

    // Validate required fields
    if (!body?.userId || !body?.email) {
      console.error('Missing required fields:', { body });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Both userId and email are required'
      }, { status: 400 });
    }

    // Verify the user ID matches
    if (user.id !== body.userId) {
      console.error('User ID mismatch:', { sessionId: user.id, requestId: body.userId });
      return NextResponse.json({ 
        error: 'Authentication error',
        details: 'User ID mismatch'
      }, { status: 401 });
    }

    // Verify email matches
    if (user.email !== body.email) {
      console.error('Email mismatch:', { sessionEmail: user.email, requestEmail: body.email });
      return NextResponse.json({ 
        error: 'Authentication error',
        details: 'Email mismatch'
      }, { status: 401 });
    }

    console.log('Creating Stripe Connect account for:', { userId: user.id, email: user.email });
    
    // Get the Stripe instance
    const stripeInstance = getStripe();
    
    try {
      // Check if user already has a Stripe account
      const supabase = createRouteHandlerClient({ cookies });
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();
        
      // If user already has a Stripe account, create a new account link for it
      if (profile?.stripe_account_id) {
        console.log('User already has Stripe account:', profile.stripe_account_id);
        
        // Create account link directly with Stripe
        const accountLink = await stripeInstance.accountLinks.create({
          account: profile.stripe_account_id,
          refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=connect-refresh`,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/callback?account_id=${profile.stripe_account_id}`,
          type: 'account_onboarding'
        });
        
        console.log('Created account link for existing account:', accountLink);
        return NextResponse.json({ url: accountLink.url });
      }
      
      // Use type assertion to handle the mock vs real implementation difference
      const accounts = stripeInstance.accounts as Stripe.AccountsResource;
      
      // Create Stripe Connect account with Express type
      const account = await accounts.create({
        type: 'express', // Changed from 'standard' to 'express'
        email: user.email,
        metadata: {
          user_id: user.id
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual'
            }
          }
        },
        business_type: 'individual', // Default to individual for Express accounts
        business_profile: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile/${user.id}`,
          mcc: '8299', // Education Services
          product_description: 'Online educational content'
        }
      });

      // Create account link using our utility
      console.log('Creating account link for account:', account.id);
      
      // Ensure we have a valid base URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Create direct account link with Stripe
      const accountLink = await stripeInstance.accountLinks.create({
        account: account.id,
        refresh_url: `${baseUrl}/profile?error=connect-refresh`,
        return_url: `${baseUrl}/api/stripe/connect/callback?account_id=${account.id}`,
        type: 'account_onboarding'
      });
      
      console.log('Account link created directly:', accountLink);

      // Store the Stripe account ID in Supabase
      console.log('Updating profile with Stripe account ID');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: account.id })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update profile with Stripe account:', updateError);
        // If we fail to update the database, delete the Stripe account to maintain consistency
        try {
          await (stripeInstance.accounts as Stripe.AccountsResource).del(account.id);
        } catch (deleteError) {
          console.error('Failed to delete Stripe account after database update error:', deleteError);
        }
        throw new Error('Failed to update profile with Stripe account');
      }

      const response = { url: accountLink.url };
      console.log('Returning response:', response);
      return NextResponse.json(response);
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      throw new Error(`Stripe API error: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Stripe Connect error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      stripeError: error instanceof Error && stripe?.errors && error instanceof stripe.errors.StripeError ? error.raw : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to create Connect account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
