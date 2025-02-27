import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session } } = await firebaseAuth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Get creator earnings
    const { data: earnings, error } = await supabase
      .from('creator_earnings')
      .select(`
        id,
        amount,
        status,
        created_at,
        payment_intent_id,
        lessons(title)
      `)
      .eq('creator_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching earnings:', error);
      return NextResponse.json(
        { error: { message: 'Failed to fetch earnings' } },
        { status: 500 }
      );
    }
    
    // Format the earnings data
    const formattedEarnings = earnings.map(earning => ({
      id: earning.id,
      amount: earning.amount,
      status: earning.status,
      created_at: earning.created_at,
      lesson_title: earning.lessons?.[0]?.title || 'Unknown lesson'
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
