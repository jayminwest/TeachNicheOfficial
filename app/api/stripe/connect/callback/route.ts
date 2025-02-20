import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session from the cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=unauthorized`
      );
    }

    const { user } = session;

    const searchParams = new URL(request.url).searchParams;
    const accountId = searchParams.get('account_id');
    
    if (!accountId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=missing-account`
      );
    }

    // Verify the account exists and is properly set up
    const account = await stripe.accounts.retrieve(accountId);
    
    // First verify that the user has a stripe_account_id in their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile.stripe_account_id) {
      console.error('Profile verification failed:', profileError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=profile-verification-failed`
      );
    }

    // Verify the account ID matches the one in the profile
    if (profile.stripe_account_id !== accountId) {
      console.error('Account ID mismatch');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=account-mismatch`
      );
    }

    if (account.details_submitted) {
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
