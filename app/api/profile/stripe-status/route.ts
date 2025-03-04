import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAccountStatus } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ 
        stripeAccountId: null,
        isComplete: false
      });
    }

    // Check if we already know the onboarding status
    if (profile.stripe_onboarding_complete !== null && profile.stripe_onboarding_complete !== undefined) {
      return NextResponse.json({
        stripeAccountId: profile.stripe_account_id,
        isComplete: profile.stripe_onboarding_complete
      });
    }

    // Otherwise check with Stripe
    try {
      const status = await getAccountStatus(profile.stripe_account_id);
      
      // Update the database with the status
      await supabase
        .from('profiles')
        .update({ stripe_onboarding_complete: status.isComplete })
        .eq('id', session.user.id);
      
      return NextResponse.json({
        stripeAccountId: profile.stripe_account_id,
        isComplete: status.isComplete
      });
    } catch (error) {
      console.error('Error checking Stripe account status:', error);
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
