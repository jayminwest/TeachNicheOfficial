import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('Starting Stripe Connect process...');
    
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body);

    // Get the session from the cookie
    const cookieStore = cookies();
    console.log('Cookies present:', cookieStore.getAll().map(c => c.name));
    
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message,
      sessionUser: session?.user?.id,
      requestUserId: body.userId
    });
    
    if (sessionError) {
      console.log('Session error:', sessionError);
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    const { user } = session;
    console.log('User found:', { 
      userId: user.id,
      hasEmail: !!user.email,
      matchesRequest: user.id === body.userId 
    });

    // Verify the user ID matches the request
    if (user.id !== body.userId) {
      console.log('User ID mismatch');
      return NextResponse.json({ error: 'Unauthorized - ID mismatch' }, { status: 401 });
    }
    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      email: user.email,
      metadata: {
        user_id: user.id
      }
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=connect-refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback?account_id=${account.id}`,
    });

    // Store the Stripe account ID in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', user.id);

    if (updateError) {
      // If we fail to update the database, delete the Stripe account to maintain consistency
      await stripe.accounts.del(account.id);
      throw new Error('Failed to update profile with Stripe account');
    }

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: 'Failed to create Connect account' },
      { status: 500 }
    );
  }
}
