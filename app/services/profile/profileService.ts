import { User } from '@supabase/supabase-js'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'

/**
 * Creates or updates a user profile in the database
 */
export async function createOrUpdateProfile(user: User): Promise<boolean> {
  try {
    const supabase = createClientSupabaseClient();
    
    // First check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing profile:', fetchError);
      return false;
    }
    
    if (!existingProfile) {
      // Create new profile if it doesn't exist
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: '',  // Initialize bio
        social_media_tag: '',  // Initialize social_media_tag
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return false;
      }
      
      console.log('Created new profile for user:', user.id);
      return true;
    }
    
    // Profile exists, update it with latest user metadata
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
    return false;
  }
}

/**
 * Gets a user profile by ID
 */
export async function getProfileById(userId: string) {
  try {
    const supabase = createClientSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting profile:', error);
    return { data: null, error };
  }
}

/**
 * Updates a user profile
 */
export async function updateProfile(userId: string, profileData: {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  social_media_tag?: string;
}) {
  try {
    const supabase = createClientSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}
