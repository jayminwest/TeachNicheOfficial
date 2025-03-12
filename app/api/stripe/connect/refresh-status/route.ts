import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAccountStatus } from '@/app/services/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ 
        error: 'No Stripe account found'
      }, { status: 404 });
    }

    // Force refresh from Stripe
    try {
      const status = await getAccountStatus(profile.stripe_account_id);
      
      // Update the database with the latest status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_onboarding_complete: status.isComplete,
          stripe_account_status: status.isComplete ? 'complete' : 'pending',
          stripe_account_details: JSON.stringify({
            pending_verification: status.pendingVerification,
            missing_requirements: status.missingRequirements,
            last_checked: new Date().toISOString()
          })
        })
        .eq('id', session.user.id);
      
      if (updateError) {
        console.error('Failed to update profile:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        status: {
          isComplete: status.isComplete,
          status: status.isComplete ? 'complete' : 
                  status.pendingVerification ? 'verification_pending' : 
                  status.missingRequirements.length > 0 ? 'requirements_needed' : 'pending',
          details: {
            pendingVerification: status.pendingVerification,
            missingRequirements: status.missingRequirements
          }
        }
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
