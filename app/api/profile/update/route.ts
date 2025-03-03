import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { full_name, bio, social_media_tag } = requestData;
    
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
    
    // Get the user's session from cookies to authenticate the request
    const cookieStore = cookies();
    const supabaseAuthCookie = cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value;
    
    if (!supabaseAuthCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the auth cookie to get the user ID
    let userId, userEmail;
    try {
      const parsedCookie = JSON.parse(supabaseAuthCookie);
      const accessToken = parsedCookie.access_token;
      
      // Verify the token and get user info
      const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
      
      if (authError || !userData.user) {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }
      
      userId = userData.user.id;
      userEmail = userData.user.email;
    } catch (error) {
      console.error('Error parsing auth cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    // We already have userId and userEmail from the auth cookie verification above
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }
    
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
        onConflict: 'id'
      });
    
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
