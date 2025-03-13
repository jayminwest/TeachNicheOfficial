import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Force complete Stripe status API endpoint called');
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

    console.log(`Found Stripe account ID: ${profile.stripe_account_id}, forcing complete status`);
    
    // Force the account to be marked as complete
    const updateData = { 
      stripe_onboarding_complete: true,
      stripe_account_status: 'complete',
      stripe_account_details: JSON.stringify({
        pending_verification: false,
        missing_requirements: [],
        has_details_submitted: true,
        has_charges_enabled: true,
        has_payouts_enabled: true,
        last_checked: new Date().toISOString()
      })
    };
    
    console.log('Updating profile with forced complete data:', JSON.stringify(updateData, null, 2));
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    console.log('Profile updated successfully with forced complete status');
    
    return NextResponse.json({
      success: true,
      message: 'Stripe account status forced to complete',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error in force-complete endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
