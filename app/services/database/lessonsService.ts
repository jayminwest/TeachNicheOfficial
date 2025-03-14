import { createClientSupabaseClient } from '@/app/lib/supabase/client';
import { DatabaseService, DatabaseResponse } from './DatabaseService';

export class LessonsService extends DatabaseService {
  /**
   * Create a new lesson
   */
  async createLesson(lessonData: {
    title: string;
    description: string;
    content?: string;
    price?: number;
    muxAssetId?: string;
  }): Promise<DatabaseResponse<any>> {
    return this.executeWithRetry(async () => {
      const supabase = createClientSupabaseClient();
      
      // Generate a UUID for the lesson
      const lessonId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          id: lessonId,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content || '',
          price: lessonData.price || 0,
          mux_asset_id: lessonData.muxAssetId,
          status: 'published',
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    });
  }

  /**
   * Get all lessons
   */
  async getLessons(options?: { 
    limit?: number; 
    offset?: number;
  }): Promise<DatabaseResponse<any[]>> {
    return this.executeWithRetry(async () => {
      const supabase = createClientSupabaseClient();
      
      let query = supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      return data || [];
    });
  }
  
  /**
   * Get a lesson's playback ID by asset ID
   */
  async getPlaybackIdByAssetId(assetId: string): Promise<DatabaseResponse<string>> {
    return this.executeWithRetry(async () => {
      const supabase = createClientSupabaseClient();
      
      const { data, error } = await supabase
        .from('lessons')
        .select('mux_playback_id')
        .eq('mux_asset_id', assetId)
        .single();
        
      if (error) throw error;
      if (!data || !data.mux_playback_id) {
        throw new Error('Playback ID not found for this asset');
      }
      
      return data.mux_playback_id;
    });
  }
}
