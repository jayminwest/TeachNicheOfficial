import { verifyStripeAccountById } from '@/app/services/stripe';
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

    try {
      // Verify the account with Stripe using only the ID
      const status = await verifyStripeAccountById(accountId);
      
      // Update the profile with the account ID and status
      const updateData = { 
        stripe_account_id: accountId,
        stripe_onboarding_complete: status.isComplete,
        stripe_account_status: status.status,
        stripe_account_details: JSON.stringify(status.details)
      };
      
      console.log('Updating profile with data:', JSON.stringify(updateData, null, 2));
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update onboarding status:', updateError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=update-failed`
        );
      }

      console.log('Profile updated successfully');
      
      // Redirect based on status
      if (status.isComplete) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=connected`
        );
      } else if (status.details.pendingVerification) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile?status=verification-pending`
        );
      } else if (status.details.missingRequirements.length > 0) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile?status=requirements-needed`
        );
      } else {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=incomplete-onboarding`
        );
      }
    } catch (error) {
      console.error('Error verifying Stripe account:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=verification-failed`
      );
    }
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=callback-failed`
    );
  }
}
