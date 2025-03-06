
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
      .select('id, title, description, price, thumbnail_url, creator_id, average_rating, total_ratings')
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
    
    // Transform the data to match the client-side expected format
    const transformedLessons = (lessons || []).map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      price: lesson.price,
      thumbnailUrl: lesson.thumbnail_url, // Map snake_case to camelCase
      creatorId: lesson.creator_id,
      averageRating: lesson.average_rating,
      totalRatings: lesson.total_ratings
    }));
    
    return NextResponse.json(transformedLessons);
  } catch (error) {
    console.error('Exception fetching lessons:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
