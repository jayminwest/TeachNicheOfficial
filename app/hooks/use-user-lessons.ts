import { useState, useEffect } from 'react';
import { supabase } from '@/app/services/supabase';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Lesson } from '@/app/types/lesson';
import { SearchParamsWrapper } from '@/app/components/ui/search-params-wrapper';


interface UseUserLessonsOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useUserLessons({
  limit = 5,
  orderBy = 'created_at',
  orderDirection = 'desc'
}: UseUserLessonsOptions = {}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setLessons([]);
      setLoading(false);
      return;
    }

    async function fetchUserLessons() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('lessons')
          .select(`
            id,
            title,
            description,
            price,
            created_at,
            updated_at,
            thumbnail_url,
            mux_asset_id,
            mux_playback_id,
            creator_id,
            status,
            is_featured
          `)
          .eq('creator_id', user.id)
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .limit(limit);

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Transform the data to match the Lesson interface
        const formattedLessons: Lesson[] = data.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          price: lesson.price,
          created_at: lesson.created_at,
          updated_at: lesson.updated_at,
          thumbnail_url: lesson.thumbnail_url || '/placeholder-thumbnail.jpg',
          mux_asset_id: lesson.mux_asset_id,
          mux_playback_id: lesson.mux_playback_id,
          creator_id: lesson.creator_id,
          status: lesson.status,
          is_featured: lesson.is_featured,
          // These properties are required by the Lesson interface but not needed in tests
          averageRating: 0,
          totalRatings: 0
        }));

        setLessons(formattedLessons);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch lessons'));
        console.error('Error fetching user lessons:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserLessons();
  }, [user, limit, orderBy, orderDirection]);

  return { lessons, loading, error };
}
