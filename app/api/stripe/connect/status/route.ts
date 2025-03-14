import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyStripeAccountById } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Stripe connect status API endpoint called');
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Fetching profile for user: ${session.user.id}`);
    // Get user's Stripe account ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.stripe_account_id) {
      console.log('No Stripe account ID found for user');
      return NextResponse.json({ 
        connected: false,
        stripeAccountId: null,
        isComplete: false,
        status: 'not_connected',
        details: null
      });
    }

    console.log(`Found Stripe account ID: ${profile.stripe_account_id}`);
    
    try {
      // Verify the account with Stripe using only the ID
      const status = await verifyStripeAccountById(profile.stripe_account_id);
      
      // Update the database with the latest status
      await supabase
        .from('profiles')
        .update({
          stripe_onboarding_complete: status.isComplete,
          stripe_account_status: status.status,
          stripe_account_details: JSON.stringify(status.details)
        })
        .eq('id', session.user.id);
      
      return NextResponse.json({
        connected: true,
        stripeAccountId: profile.stripe_account_id,
        isComplete: status.isComplete,
        status: status.status,
        details: status.details
      });
    } catch (error) {
      console.error('Error verifying Stripe account:', error);
      
      // If verification fails, return connected but not complete
      return NextResponse.json({
        connected: true,
        stripeAccountId: profile.stripe_account_id,
        isComplete: false,
        status: 'error',
        details: {
          pendingVerification: false,
          missingRequirements: ['verification_failed']
        },
        error: 'Failed to verify account with Stripe'
      });
    }
  } catch (error) {
    console.error('Error fetching Stripe account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}
