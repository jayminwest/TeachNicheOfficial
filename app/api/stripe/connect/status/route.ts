import { stripe } from '@/app/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe account ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 404 });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    return NextResponse.json({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      capabilities: account.capabilities,
      requirements: account.requirements,
      country: account.country,
      default_currency: account.default_currency
    });
  } catch (error) {
    console.error('Error fetching Stripe account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}
