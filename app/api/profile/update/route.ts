import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { full_name, bio, social_media_tag } = requestData;
    
    // Create a Supabase server client using the new approach
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // This is a read-only operation in an API route
          },
          remove(name: string, options: any) {
            // This is a read-only operation in an API route
          },
        },
      }
    );
    
    // Get the user's session to verify they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userEmail = session.user.email;
    
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
