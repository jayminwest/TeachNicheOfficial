import { verifyConnectedAccount } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Stripe Connect callback received');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the session from the cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No session found:', sessionError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=unauthorized`
      );
    }

    const { user } = session;
    console.log('User authenticated:', user.id);
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    
    console.log('Received account_id from Stripe:', accountId);
    
    if (!accountId) {
      console.error('No account_id provided in callback');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=missing-account`
      );
    }

    // Verify the connected account using our utility
    console.log('Verifying connected account...');
    const verificationResult = await verifyConnectedAccount(user.id, accountId, supabase);
    console.log('Verification result:', JSON.stringify(verificationResult, null, 2));
    
    const { verified, status } = verificationResult;

    if (!verified) {
      console.error('Account verification failed');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=account-mismatch`
      );
    }

    // For Express accounts, we need to check if the account is ready for payouts
    const isComplete = status.isComplete;
    const pendingVerification = status.pendingVerification;
    const missingRequirements = status.missingRequirements;
    const hasDetailsSubmitted = status.has_details_submitted;
    const hasChargesEnabled = status.has_charges_enabled;
    const hasPayoutsEnabled = status.has_payouts_enabled;

    console.log('Stripe account status details:', {
      isComplete,
      pendingVerification,
      missingRequirements,
      hasDetailsSubmitted,
      hasChargesEnabled,
      hasPayoutsEnabled
    });

    // Store additional status information
    const updateData = { 
      stripe_onboarding_complete: isComplete,
      stripe_account_status: isComplete ? 'complete' : 'pending',
      stripe_account_details: JSON.stringify({
        pending_verification: pendingVerification,
        missing_requirements: missingRequirements,
        has_details_submitted: hasDetailsSubmitted,
        has_charges_enabled: hasChargesEnabled,
        has_payouts_enabled: hasPayoutsEnabled,
        last_checked: new Date().toISOString()
      })
    };
    
    console.log('Updating profile with data:', JSON.stringify(updateData, null, 2));
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .eq('stripe_account_id', accountId); // Additional safety check

    if (updateError) {
      console.error('Failed to update onboarding status:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=update-failed`
      );
    }

    console.log('Profile updated successfully');

    // After update, fetch the profile to verify the data was saved correctly
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, stripe_account_details, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();
      
    if (fetchError) {
      console.error('Failed to fetch updated profile:', fetchError);
    } else {
      console.log('Updated profile data:', JSON.stringify(updatedProfile, null, 2));
    }

    if (isComplete) {
      console.log('Redirecting to success page - account is complete');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=connected`
      );
    } else if (pendingVerification) {
      console.log('Redirecting to verification pending page');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?status=verification-pending`
      );
    } else if (missingRequirements.length > 0) {
      console.log('Redirecting to requirements needed page');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?status=requirements-needed`
      );
    } else {
      console.log('Redirecting to incomplete onboarding page');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=incomplete-onboarding`
      );
    }
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=callback-failed`
    );
  }
}
