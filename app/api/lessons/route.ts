
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch lessons
    let query = supabase
      .from('lessons')
      .select('id, title, description, price, thumbnailUrl, creatorId, averageRating, totalRatings')
      .order('created_at', { ascending: false });
    
    // If user is logged in, include their lessons
    if (user) {
      query = query.or(`creatorId.eq.${user.id},public.eq.true`);
    } else {
      query = query.eq('public', true);
    }
    
    const { data: lessons, error } = await query;
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lessons: lessons || [] });
  } catch (error) {
    console.error('Exception fetching lessons:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
