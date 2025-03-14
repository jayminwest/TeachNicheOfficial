import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { verifyStripeAccountById } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Stripe status API endpoint called');
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Fetching profile for user: ${session.user.id}`);
    // Get user's Stripe account ID from profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!profile?.stripe_account_id) {
      console.log('No Stripe account ID found for user');
      return NextResponse.json({ 
        stripeAccountId: null,
        isComplete: false
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
          stripe_account_status: status.isComplete ? 'complete' : 'pending',
          stripe_account_details: JSON.stringify(status.details)
        })
        .eq('id', session.user.id);
      
      return NextResponse.json({
        stripeAccountId: profile.stripe_account_id,
        isComplete: status.isComplete,
        status: status.isComplete ? 'complete' : 'pending',
        details: status.details
      });
    } catch (error) {
      console.error('Error checking Stripe account status:', error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : 'Unknown error type');
      
      return NextResponse.json({
        stripeAccountId: profile.stripe_account_id,
        isComplete: false,
        error: 'Failed to check Stripe account status'
      });
    }
  } catch (error) {
    console.error('Error in stripe-status endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
