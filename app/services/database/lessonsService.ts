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
  async getLessons(): Promise<DatabaseResponse<any[]>> {
    return this.executeWithRetry(async () => {
      const supabase = createClientSupabaseClient();
      
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    });
  }
}
