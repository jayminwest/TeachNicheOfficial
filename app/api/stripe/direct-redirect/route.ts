import { NextResponse } from 'next/server';
import { getStripe, createConnectSession } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('Authentication error:', sessionError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?error=auth`);
    }
    
    const userId = session.user.id;
    console.log('Processing Stripe connect for user:', userId);
    
    // Check if user already has a Stripe account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/profile?error=profile`);
    }
    
    const stripe = getStripe();
    let accountId = profile.stripe_account_id;
    
    // If user doesn't have a Stripe account, create one
    if (!accountId) {
      // Get user email from auth
      const userEmail = session.user.email;
      
      // Create a Stripe account for this user
      const account = await (stripe.accounts as Stripe.AccountsResource).create({
        type: 'express',
        email: userEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          user_id: userId
        }
      });
      
      accountId = account.id;
      console.log('Created Stripe account:', accountId, 'for user:', userId);
      
      // Store the Stripe account ID in the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/profile?error=update`);
      }
      
      console.log('Updated profile with Stripe account ID');
    } else {
      console.log('Using existing Stripe account:', accountId);
    }
    
    // Get base URL for redirects - use the request origin or env var
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (request.headers.get('origin') || 'https://teach-niche-git-dev-tandemflow.vercel.app');
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/profile?refresh=true`,
      return_url: `${baseUrl}/profile?success=true&account_id=${accountId}`,
      type: 'account_onboarding'
    });
    
    console.log('Created account link, redirecting to:', accountLink.url);
    
    // Redirect directly to the Stripe URL
    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error('Direct redirect error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If there's an error, redirect to profile with error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/profile?error=stripe&message=${encodeURIComponent(errorMessage)}`
    );
  }
}
