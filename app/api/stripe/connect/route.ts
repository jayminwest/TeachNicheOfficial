import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    console.log('Authenticated user:', user);
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: `Invalid request body: ${e instanceof Error ? e.message : 'Unknown error'}` }, { status: 400 });
    }

    // Verify the user ID matches
    if (user.id !== body.userId) {
      console.error('User ID mismatch:', { sessionId: user.id, requestId: body.userId });
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 401 });
    }
    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      email: user.email,
      metadata: {
        user_id: user.id
      }
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=connect-refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/callback?account_id=${account.id}`,
    });

    // Store the Stripe account ID in Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', user.id);

    if (updateError) {
      // If we fail to update the database, delete the Stripe account to maintain consistency
      await stripe.accounts.del(account.id);
      throw new Error('Failed to update profile with Stripe account');
    }

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      stripeError: error instanceof stripe.errors.StripeError ? error.raw : undefined
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
