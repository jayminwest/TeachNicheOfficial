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

    // Import ProfileService
    const { ProfileService } = await import('@/app/services/profile/profileService');
    const profileService = new ProfileService();
    
    // Get fresh account status using our utility
    try {
      // Use the shared function to update status
      const { updateProfileStripeStatus } = await import('@/app/services/stripe');
      const statusResult = await updateProfileStripeStatus(
        session.user.id,
        profile.stripe_account_id,
        supabase
      );
      
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
