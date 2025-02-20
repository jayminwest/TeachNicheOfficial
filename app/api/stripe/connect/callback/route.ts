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
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=unauthorized`
      );
    }

    const { user } = session;

    const searchParams = new URL(request.url).searchParams;
    const accountId = searchParams.get('account_id');
    
    if (!accountId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=missing-account`
      );
    }

    // Verify the account exists and is properly set up
    const account = await stripe.accounts.retrieve(accountId);
    
    if (!account.details_submitted) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=incomplete-onboarding`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=connected`
    );
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=callback-failed`
    );
  }
}
