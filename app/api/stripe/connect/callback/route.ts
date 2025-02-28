import { verifyConnectedAccount } from '@/app/services/stripe';
import { NextResponse } from 'next/server';
import { getAuth, getApp } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the session from the cookie
    const { session, error: sessionError } = await new Promise<{ session: { user: any } | null, error: any }>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve({ 
          session: user ? { user } : null, 
          error: null 
        });
      });
    });
    
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

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the connected account using our utility
    const { verified, status } = await verifyConnectedAccount(user.uid, accountId, supabase);

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
        .eq('id', user.uid)
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
