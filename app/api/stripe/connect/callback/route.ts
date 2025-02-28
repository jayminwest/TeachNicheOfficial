import { verifyConnectedAccount } from '@/app/services/stripe';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { firebaseClient } from '@/app/services/firebase-compat';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the session from the cookie
    const { session, error: sessionError } = await new Promise<{ 
      session: { user: { uid: string } } | null, 
      error: Error | null 
    }>(resolve => {
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

    // Verify the connected account using our utility
    const { verified, status } = await verifyConnectedAccount(user.uid, accountId, firebaseClient);

    if (!verified) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=account-mismatch`
      );
    }

    const isComplete = status.isComplete;

    if (isComplete) {
      // Update onboarding status only if we have verified everything
      try {
        // Query for the profile directly with the right conditions
        const profilesRef = firebaseClient.from('profiles');
        const profilesQuery = profilesRef.select();
        
        // Execute the query
        const profilesResult = await profilesQuery;
        
        // Check if we got results and find the matching profile
        if (profilesResult && Array.isArray(profilesResult)) {
          const matchingProfile = profilesResult.find(
            profile => profile.id === user.uid && profile.stripe_account_id === accountId
          );
          
          if (matchingProfile) {
            // Update the profile if found
            await firebaseClient.from('profiles').update(
              { 
                stripe_onboarding_complete: true 
              },
              `id = '${user.uid}'`
            );
          }
        }
      } catch (updateError) {
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
