import { getAccountStatus } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    // Get user's Stripe account ID and status from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, stripe_account_status, stripe_account_details')
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
    
    // Always get fresh account status using our utility
    try {
      console.log('Fetching fresh status from Stripe');
      // Use the shared function to update status
      const { updateProfileStripeStatus } = await import('@/app/services/stripe');
      const statusResult = await updateProfileStripeStatus(
        session.user.id,
        profile.stripe_account_id,
        supabase
      );
      
      console.log('Successfully updated Stripe status:', JSON.stringify(statusResult, null, 2));
      
      return NextResponse.json({
        connected: true,
        stripeAccountId: profile.stripe_account_id,
        isComplete: statusResult.isComplete,
        status: statusResult.status,
        details: statusResult.details
      });
    } catch (error) {
      // Log detailed error information
      console.error('Error fetching Stripe account status:', error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : 'Unknown error type');
      
      // If we can't reach Stripe, return the cached status
      return NextResponse.json({
        connected: true,
        stripeAccountId: profile.stripe_account_id,
        isComplete: profile.stripe_onboarding_complete,
        status: profile.stripe_account_status || 'unknown',
        details: profile.stripe_account_details || null,
        error: 'Failed to fetch fresh status from Stripe'
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
