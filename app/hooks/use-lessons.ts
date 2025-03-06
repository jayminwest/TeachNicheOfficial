import { useState, useEffect } from 'react'
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
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3; // Set a maximum number of retries
  
  useEffect(() => {
    // Skip fetching if we've reached the maximum retry count
    if (retryCount >= maxRetries) {
      return;
    }
    
    async function fetchLessons() {
      setLoading(true)
      setError(null)
      
      try {
        const { data, error, success } = await lessonsService.getLessons(options)
        
        if (!success || error) {
          throw error || new Error('Failed to fetch lessons')
        }
        
        setLessons(data || [])
      } catch (err) {
        console.error('Error fetching lessons:', err)
        setError(err instanceof Error ? err : new Error('An unknown error occurred'))
        setRetryCount(prev => prev + 1); // Increment retry count on error
      } finally {
        setLoading(false)
      }
    }
    
    fetchLessons()
  }, [options, retryCount])
  
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
