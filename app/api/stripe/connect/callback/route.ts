import { verifyConnectedAccount } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the session from the cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=unauthorized`
      );
    }

    const { user } = session;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    
    if (!accountId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=missing-account`
      );
    }

    // Verify the connected account using our utility
    const { verified, status } = await verifyConnectedAccount(user.id, accountId, supabase);

    if (!verified) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=account-mismatch`
      );
    }

    // For Express accounts, we need to check if the account is ready for payouts
    const isComplete = status.isComplete;
    const pendingVerification = status.pendingVerification;
    const missingRequirements = status.missingRequirements;

    // Store additional status information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        stripe_onboarding_complete: isComplete,
        stripe_account_status: isComplete ? 'complete' : 'pending',
        stripe_account_details: {
          pending_verification: pendingVerification,
          missing_requirements: missingRequirements,
          last_checked: new Date().toISOString()
        }
      })
      .eq('id', user.id)
      .eq('stripe_account_id', accountId); // Additional safety check

    if (updateError) {
      console.error('Failed to update onboarding status:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=update-failed`
      );
    }

    if (isComplete) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=connected`
      );
    } else if (pendingVerification) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?status=verification-pending`
      );
    } else if (missingRequirements.length > 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?status=requirements-needed`
      );
    } else {
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
