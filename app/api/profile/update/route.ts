import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { full_name, bio, social_media_tag, userId, userEmail } = requestData;
    
    // Validate required fields from the client
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }
    
    // Create a Supabase admin client that bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key to bypass RLS
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // We already validated userId and userEmail from the request body above
    
    // Update the profile using the server-side client
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        full_name,
        bio,
        social_media_tag,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        returning: 'minimal'  // Don't need to return the row
      });
    
    // Log the result for debugging
    console.log('Profile update result:', { error });
    
    if (error) {
      console.error('Server profile update error:', error);
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in profile update API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
