import { NextResponse } from 'next/server';
import { getAuth, User } from "firebase/auth";
import { getApp } from "firebase/app";
import { firebaseClient } from '@/app/services/firebase-compat';

// Define the auth response type
interface AuthResponse {
  data: {
    session: { user: User } | null;
  };
  error: null | unknown;
}

export async function GET() {
  try {
    // Get the current user
    const { data: { session } } = await new Promise<AuthResponse>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve({ data: { session: user ? { user } : null }, error: null });
      });
    });
    
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Get creator earnings
    const { data: earnings, error } = await firebaseClient
      .from('creator_earnings')
      .select()
      .eq('creator_id', user.uid);
    
    // Sort the earnings by created_at in descending order
    const sortedEarnings = earnings ? 
      [...earnings].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) : 
      [];
    
    if (error) {
      console.error('Error fetching earnings:', error);
      return NextResponse.json(
        { error: { message: 'Failed to fetch earnings' } },
        { status: 500 }
      );
    }
    
    // Format the earnings data
    const formattedEarnings = sortedEarnings.map(earning => ({
      id: earning.id,
      amount: earning.amount,
      status: earning.status,
      created_at: earning.created_at,
      // Adjust for the new data structure - lessons might not be available in the same format
      lesson_title: earning.lesson_title || 'Unknown lesson'
    }));
    
    return NextResponse.json({ earnings: formattedEarnings });
  } catch (error) {
    console.error('Unexpected error in earnings API:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
