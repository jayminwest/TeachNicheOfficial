import { DatabaseService, DatabaseResponse } from './databaseService'
import { Lesson } from '@/types/lesson'
import { PostgrestError } from '@supabase/supabase-js'

interface LessonCreateData {
  title: string;
  description: string;
  content: string;
  price: number;
  mux_asset_id?: string;
  mux_playback_id?: string;
}

interface LessonUpdateData {
  title?: string;
  description?: string;
  content?: string;
  price?: number;
  mux_asset_id?: string;
  mux_playback_id?: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
  previous_stripe_price_ids?: string[];
}

export class LessonsService extends DatabaseService {
  /**
   * Get all lessons with optional filtering
   */
  async getLessons(options?: { 
    limit?: number; 
    offset?: number; 
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<DatabaseResponse<Lesson[]>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      let query = supabase
        .from('lessons')
        .select(`
          *,
          reviews (
            rating
          )
        `);
      
      // Apply options if provided
      if (options?.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { data: null, error };
      }
      
      // Transform the data to match the Lesson type
      const transformedLessons: Lesson[] = (data || []).map(lesson => {
        const reviews = lesson.reviews || [];
        const totalRatings = reviews.length;
        const averageRating = totalRatings > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings 
          : 0;

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          price: lesson.price,
          thumbnailUrl: lesson.thumbnail_url || '/placeholder-lesson.jpg',
          created_at: lesson.created_at,
          mux_asset_id: lesson.mux_asset_id || '',
          mux_playback_id: lesson.mux_playback_id || '',
          creator_id: lesson.creator_id || '',
          stripe_product_id: lesson.stripe_product_id,
          stripe_price_id: lesson.stripe_price_id,
          previous_stripe_price_ids: lesson.previous_stripe_price_ids || [],
          averageRating,
          totalRatings
        };
      });
      
      return { data: transformedLessons, error: null };
    });
  }
  
  /**
   * Get a lesson by ID
   */
  async getLessonById(id: string): Promise<DatabaseResponse<Lesson>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          reviews (
            rating
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      // Transform to Lesson type
      const reviews = data.reviews || [];
      const totalRatings = reviews.length;
      const averageRating = totalRatings > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings 
        : 0;
      
      const lesson: Lesson = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        content: data.content || '',
        price: data.price,
        thumbnailUrl: data.thumbnail_url || '/placeholder-lesson.jpg',
        created_at: data.created_at,
        mux_asset_id: data.mux_asset_id || '',
        mux_playback_id: data.mux_playback_id || '',
        creatorId: data.creator_id || '',
        stripe_product_id: data.stripe_product_id,
        stripe_price_id: data.stripe_price_id,
        previous_stripe_price_ids: data.previous_stripe_price_ids || [],
        averageRating,
        totalRatings
      };
      
      return { data: lesson, error: null };
    });
  }
  
  /**
   * Create a new lesson
   */
  async createLesson(data: LessonCreateData): Promise<DatabaseResponse<Lesson>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { 
          data: null, 
          error: {
            message: 'Unauthorized',
            details: 'User not authenticated',
            hint: 'Please sign in',
            code: 'UNAUTHORIZED'
          } as PostgrestError
        };
      }
      
      // For paid lessons, check if user has a Stripe account
      if (data.price > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          return {
            data: null,
            error: {
              message: `Failed to verify profile: ${profileError.message}`,
              details: profileError.message,
              hint: 'Check user profile',
              code: 'PROFILE_ERROR'
            } as PostgrestError
          };
        }
        
        if (!profileData.stripe_account_id) {
          return {
            data: null,
            error: {
              message: 'Stripe account required for paid lessons',
              details: 'Missing Stripe account',
              hint: 'Connect a Stripe account first',
              code: 'STRIPE_REQUIRED'
            } as PostgrestError
          };
        }
      }
      
      // Generate a UUID for the new lesson
      const lessonId = crypto.randomUUID();
      
      const { data: insertData, error } = await supabase
        .from('lessons')
        .insert({
          id: lessonId,
          title: data.title,
          description: data.description,
          content: data.content,
          price: data.price,
          mux_asset_id: data.mux_asset_id,
          mux_playback_id: data.mux_playback_id,
          creator_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'draft',
          is_featured: false,
          version: 1
        })
        .select()
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      const lesson: Lesson = {
        id: insertData.id,
        title: insertData.title,
        description: insertData.description || '',
        content: insertData.content || '',
        price: insertData.price,
        thumbnailUrl: insertData.thumbnail_url || '/placeholder-lesson.jpg',
        created_at: insertData.created_at,
        mux_asset_id: insertData.mux_asset_id || '',
        mux_playback_id: insertData.mux_playback_id || '',
        creator_id: insertData.creator_id || '',
        averageRating: 0,
        totalRatings: 0
      };
      
      return { data: lesson, error: null };
    });
  }
  
  /**
   * Update a lesson
   */
  async updateLesson(id: string, data: LessonUpdateData): Promise<DatabaseResponse<Lesson>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { 
          data: null, 
          error: {
            message: 'Unauthorized',
            details: 'User not authenticated',
            hint: 'Please sign in',
            code: 'UNAUTHORIZED'
          } as PostgrestError
        };
      }
      
      // Check if user owns this lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('creator_id')
        .eq('id', id)
        .single();
      
      if (lessonError) {
        return { data: null, error: lessonError };
      }
      
      if (lessonData.creator_id !== session.user.id) {
        return { 
          data: null, 
          error: {
            message: 'Unauthorized',
            details: 'User does not own this lesson',
            hint: 'Check lesson ownership',
            code: 'UNAUTHORIZED'
          } as PostgrestError
        };
      }
      
      // Update the lesson
      const { data: updateData, error } = await supabase
        .from('lessons')
        .update({
          title: data.title,
          description: data.description,
          content: data.content,
          price: data.price,
          mux_asset_id: data.mux_asset_id,
          mux_playback_id: data.mux_playback_id,
          stripe_product_id: data.stripe_product_id,
          stripe_price_id: data.stripe_price_id,
          previous_stripe_price_ids: data.previous_stripe_price_ids,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          reviews (
            rating
          )
        `)
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      // Transform to Lesson type
      const reviews = updateData.reviews || [];
      const totalRatings = reviews.length;
      const averageRating = totalRatings > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings 
        : 0;
      
      const lesson: Lesson = {
        id: updateData.id,
        title: updateData.title,
        description: updateData.description || '',
        content: updateData.content || '',
        price: updateData.price,
        thumbnailUrl: updateData.thumbnail_url || '/placeholder-lesson.jpg',
        created_at: updateData.created_at,
        mux_asset_id: updateData.mux_asset_id || '',
        mux_playback_id: updateData.mux_playback_id || '',
        creator_id: updateData.creator_id || '',
        stripe_product_id: updateData.stripe_product_id,
        stripe_price_id: updateData.stripe_price_id,
        previous_stripe_price_ids: updateData.previous_stripe_price_ids || [],
        averageRating,
        totalRatings
      };
      
      return { data: lesson, error: null };
    });
  }
  /**
   * Check if a user is the owner of a lesson
   */
  async isLessonOwner(userId: string, lessonId: string): Promise<DatabaseResponse<boolean>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('lessons')
        .select('creator_id')
        .eq('id', lessonId)
        .single();
      
      if (error) {
        return { 
          data: false, 
          error 
        };
      }
      
      return { 
        data: data.creator_id === userId, 
        error: null 
      };
    });
  }

  /**
   * Delete a lesson (soft delete)
   */
  async deleteLesson(id: string): Promise<DatabaseResponse<null>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      // Perform a soft delete by setting deleted_at
      const { error } = await supabase
        .from('lessons')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        return { data: null, error };
      }
      
      return { data: null, error: null };
    });
  }
}

// Create a singleton instance
export const lessonsService = new LessonsService();
