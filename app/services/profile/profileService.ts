import { User } from '@supabase/supabase-js'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'
import { DatabaseService } from '../database/DatabaseService';

/**
 * Service for managing user profiles
 */
export class ProfileService extends DatabaseService {
  /**
   * Creates or updates a user profile in the database
   */
  async createOrUpdateProfile(user: User) {
    return this.executeWithRetry(async () => {
      const supabase = createClientSupabaseClient();
      
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`Error checking for existing profile: ${fetchError.message}`);
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
          throw new Error(`Error creating profile: ${insertError.message}`);
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
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      return true;
    });
  }

  /**
   * Gets a user profile by ID
   */
  async getProfileById(userId: string) {
    return this.executeWithRetry(async () => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    });
  }

  /**
   * Updates a user profile
   */
  async updateProfile(userId: string, profileData: {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    social_media_tag?: string;
  }) {
    return this.executeWithRetry(async () => {
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
      
      return data;
    });
  }
}

// For backward compatibility, export functions that use the service
const profileService = new ProfileService();

/**
 * Creates or updates a user profile in the database
 */
export async function createOrUpdateProfile(user: User): Promise<boolean> {
  const response = await profileService.createOrUpdateProfile(user);
  return response.success && !!response.data;
}

/**
 * Gets a user profile by ID
 */
export async function getProfileById(userId: string) {
  const response = await profileService.getProfileById(userId);
  return { 
    data: response.data, 
    error: response.error 
  };
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
  const response = await profileService.updateProfile(userId, profileData);
  return { 
    data: response.data, 
    error: response.error 
  };
}
