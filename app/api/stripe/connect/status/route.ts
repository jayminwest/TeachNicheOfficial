import { getAccountStatus } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe account ID and status from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, stripe_account_status, stripe_account_details')
      .eq('id', session.user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ 
        connected: false,
        stripeAccountId: null,
        isComplete: false,
        status: 'not_connected',
        details: null
      });
    }

    // Get fresh account status using our utility
    try {
      const status = await getAccountStatus(profile.stripe_account_id);
      
      // Update the database with the latest status if it's changed
      if (status.isComplete !== profile.stripe_onboarding_complete) {
        await supabase
          .from('profiles')
          .update({
            stripe_onboarding_complete: status.isComplete,
            stripe_account_status: status.isComplete ? 'verified' : 'pending',
            stripe_account_details: {
              pending_verification: status.pendingVerification,
              missing_requirements: status.missingRequirements,
              last_checked: new Date().toISOString()
            }
          })
          .eq('id', session.user.id);
      }
      
      return NextResponse.json({
        connected: true,
        stripeAccountId: profile.stripe_account_id,
        isComplete: status.isComplete,
        status: status.isComplete ? 'complete' : 
                status.pendingVerification ? 'verification_pending' : 
                status.missingRequirements.length > 0 ? 'requirements_needed' : 'pending',
        details: {
          pendingVerification: status.pendingVerification,
          missingRequirements: status.missingRequirements
        }
      });
    } catch (_) {
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
