import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAccountStatus } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Refresh Stripe status API endpoint called');
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
        error: 'No Stripe account found'
      }, { status: 404 });
    }

    console.log(`Found Stripe account ID: ${profile.stripe_account_id}, forcing refresh`);
    
    // Refresh from Stripe using the shared function
    try {
      const { updateProfileStripeStatus } = await import('@/app/services/stripe');
      const statusResult = await updateProfileStripeStatus(
        session.user.id,
        profile.stripe_account_id,
        supabase
      );
        
      console.log('Successfully refreshed Stripe status:', JSON.stringify(statusResult, null, 2));
        
      // Return the actual status instead of forcing it to complete
      return NextResponse.json({
        success: true,
        status: statusResult
      });
    } catch (error) {
      console.error('Error refreshing Stripe status:', error);
      return NextResponse.json({ error: 'Failed to refresh Stripe status' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in refresh-status endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
