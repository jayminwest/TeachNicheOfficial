import { verifyConnectedAccount } from '@/app/services/stripe';
import { getAuth } from 'firebase/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = getAuth()({ cookies });
    
    // Get the session from the cookie
    const { data: { session }, error: sessionError } = await firebaseAuth.getSession();
    
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

    const isComplete = status.isComplete;

    if (isComplete) {
      // Update onboarding status only if we have verified everything
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          stripe_onboarding_complete: true 
        })
        .eq('id', user.id)
        .eq('stripe_account_id', accountId); // Additional safety check

      if (updateError) {
        console.error('Failed to update onboarding status:', updateError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=update-failed`
        );
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=connected`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=incomplete-onboarding`
    );
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=callback-failed`
    );
  }
}
