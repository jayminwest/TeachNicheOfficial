import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=unauthorized`
      );
    }

    // Get the user's Stripe account
    const { data: accounts } = await stripe.accounts.list({
      limit: 1,
      email: user.email,
    });

    if (accounts && accounts.data[0]) {
      // Store the Stripe account ID in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: accounts.data[0].id })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=update-failed`
        );
      }
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
