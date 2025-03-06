import { useState, useEffect, useRef } from 'react'
import { lessonsService } from '@/app/services/database/lessonsService'
import { Lesson } from '@/app/types/lesson'

interface UseLessonsOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useLessons(options?: UseLessonsOptions) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Use a ref instead of state for tracking retries
  // This won't trigger re-renders or affect the dependency array
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  useEffect(() => {
    let isMounted = true;
    retryCountRef.current = 0; // Reset retry count on options change
    
    async function fetchLessons() {
      // Skip if we've reached max retries
      if (retryCountRef.current >= maxRetries) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }
      
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      
      try {
        const { data, error, success } = await lessonsService.getLessons(options);
        
        if (!isMounted) return;
        
        if (!success || error) {
          throw error || new Error('Failed to fetch lessons');
        }
        
        setLessons(data || []);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error fetching lessons:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        
        // Increment retry count without state updates
        retryCountRef.current += 1;
        
        // Schedule a retry with exponential backoff
        if (retryCountRef.current < maxRetries) {
          const backoffTime = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
          setTimeout(() => {
            if (isMounted) {
              fetchLessons(); // Retry the fetch
            }
          }, backoffTime);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchLessons();
    
    return () => {
      isMounted = false;
    };
  }, [options]); // Only depends on options
  
  return { lessons, loading, error }
}

export function useLesson(id: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    async function fetchLesson() {
      if (!id) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const { data, error, success } = await lessonsService.getLessonById(id)
        
        if (!success || error) {
          throw error || new Error('Failed to fetch lesson')
        }
        
        setLesson(data)
      } catch (err) {
        console.error('Error fetching lesson:', err)
        setError(err instanceof Error ? err : new Error('An unknown error occurred'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchLesson()
  }, [id])
  
  return { lesson, loading, error }
}
