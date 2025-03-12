import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAccountStatus } from '@/app/services/stripe';

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
      .select('stripe_account_id, stripe_onboarding_complete')
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
    // Always fetch fresh status from Stripe

    // Otherwise check with Stripe
    try {
      // Use the shared function to update status
      const { updateProfileStripeStatus } = await import('@/app/services/stripe');
      const statusResult = await updateProfileStripeStatus(
        session.user.id,
        profile.stripe_account_id,
        supabase
      );
      
      return NextResponse.json({
        stripeAccountId: profile.stripe_account_id,
        isComplete: statusResult.isComplete,
        status: statusResult.status,
        details: statusResult.details
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
