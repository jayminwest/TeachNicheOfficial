import { stripe, createConnectSession, getStripe } from '@/app/services/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { firebaseClient } from '@/app/services/firebase-compat';

export const dynamic = 'force-dynamic';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request): Promise<{ 
  user?: { uid: string; email: string }; 
  error?: Error 
}> {
  // First try cookie-based session
  const sessionData = await new Promise<{ user: { uid: string; email: string } } | null>(resolve => {
    const auth = getAuth(getApp());
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user ? { user: { uid: user.uid, email: user.email || '' } } : null);
    });
  });

  if (sessionData?.user) {
    return { user: sessionData.user };
  }

  // If no cookie session, check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Use Firebase Admin SDK to verify the token
      const decodedToken = await firebaseClient.auth.verifyIdToken(token);
      if (decodedToken.uid) {
        return { user: { uid: decodedToken.uid, email: decodedToken.email || '' } };
      }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Token verification failed') };
    }
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
    if (user.uid !== body.userId) {
      console.error('User ID mismatch:', { sessionId: user.uid, requestId: body.userId });
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

    console.log('Creating Stripe Connect account for:', { userId: user.uid, email: user.email });
    
    // Get the Stripe instance
    const stripeInstance = getStripe();
    
    try {
      // Create Stripe Connect account with international support
      const account = await (stripeInstance as unknown as Stripe).accounts.create({
        type: 'standard',
        email: user.email,
        metadata: {
          user_id: user.uid
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
        }
      });

      // Create account link using our utility
      const accountLink = await createConnectSession({
        accountId: account.id,
        refreshUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=connect-refresh`,
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/callback?account_id=${account.id}`,
        type: 'account_onboarding'
      });

      // Store the Stripe account ID in our database
      try {
        await firebaseClient
          .from('profiles')
          .update({ stripe_account_id: account.id })
          .eq('id', user.uid);
      } catch (dbError) {
        console.error('Database update error:', dbError);
        
        // If we fail to update the database, delete the Stripe account to maintain consistency
        try {
          await (stripeInstance as unknown as Stripe).accounts.del(account.id);
        } catch (deleteError) {
          console.error('Failed to delete Stripe account after database update error:', deleteError);
        }
        throw new Error('Failed to update profile with Stripe account');
      }

      return NextResponse.json({ url: accountLink.url });
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
