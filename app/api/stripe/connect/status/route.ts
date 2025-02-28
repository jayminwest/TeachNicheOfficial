import { getAccountStatus } from '@/app/services/stripe';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { FirestoreDatabase } from '@/app/services/database/firebase-database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: { session } } = await new Promise<{ 
      data: { session: { user: { uid: string } } | null }, 
      error: null 
    }>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve({ data: { session: user ? { user } : null }, error: null });
      });
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.uid;
    
    // Get user's Stripe account ID from profile using Firebase
    const db = new FirestoreDatabase();
    const profilesSnapshot = await db.query('profiles', [
      { field: 'id', operator: '==', value: userId }
    ]);
    
    // Handle the database response properly
    const profile = profilesSnapshot && Array.isArray(profilesSnapshot.rows) && profilesSnapshot.rows.length > 0 
      ? profilesSnapshot.rows[0] as { stripe_account_id?: string }
      : null;

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 404 });
    }

    // Get account status using our utility
    const status = await getAccountStatus(typedProfile.stripe_account_id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching Stripe account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}
