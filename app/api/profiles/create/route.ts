import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Create a server-side Supabase client that can access cookies
    const supabase = createServerSupabaseClient();
    
    // Verify the user is authenticated using the server client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('Auth session missing in profile creation!');
      return NextResponse.json(
        { error: 'Unauthorized - No valid session found' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    
    // Validate that the user ID in the request matches the authenticated user
    if (body.id !== session.user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // We already created the supabase client above
    
    console.log('Creating profile for user:', session.user.id);
    
    // Check if profile already exists
    const { data: existingProfiles, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.id);
      
    if (profileCheckError) {
      console.error('Error checking for existing profile:', profileCheckError);
      return NextResponse.json(
        { error: profileCheckError.message },
        { status: 500 }
      );
    }
    
    const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;
      
    if (existingProfile) {
      // Profile exists, just return success
      return NextResponse.json({ success: true, message: 'Profile already exists' });
    }
    
    // Create the profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: body.id,
        full_name: body.full_name || '',
        bio: body.bio || '',
        social_media_tag: body.social_media_tag || '',
        email: body.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in profile creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
