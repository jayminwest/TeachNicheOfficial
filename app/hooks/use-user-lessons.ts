import { useState, useEffect } from 'react';
import { supabase } from '@/app/services/supabase';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Lesson } from '@/types/lesson';

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
            video_asset_id,
            creator_id,
            published,
            average_rating,
            total_ratings
          `)
          .eq('creator_id', user.id)
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .limit(limit);

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Transform the data to match the Lesson interface
        const formattedLessons = data.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          price: lesson.price,
          createdAt: lesson.created_at,
          updatedAt: lesson.updated_at,
          thumbnailUrl: lesson.thumbnail_url || '/placeholder-thumbnail.jpg',
          videoAssetId: lesson.video_asset_id,
          creatorId: lesson.creator_id,
          published: lesson.published,
          averageRating: lesson.average_rating || 0,
          totalRatings: lesson.total_ratings || 0
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
