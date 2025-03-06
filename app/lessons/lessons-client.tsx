'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { LessonGrid } from '@/app/components/ui/lesson-grid';
import { Button } from '@/app/components/ui/button';
import { Loader2, Plus, RefreshCw } from 'lucide-react';

export default function LessonsClient() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    async function fetchLessons() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/lessons');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `Server error: ${response.status}`;
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load lessons: ${errorMessage}`);
        
        // Auto-retry logic
        if (retryCount < maxRetries) {
          const nextRetry = retryCount + 1;
          setRetryCount(nextRetry);
          console.log(`Retrying (${nextRetry}/${maxRetries}) in ${retryDelay * Math.pow(2, retryCount)}ms...`);
          setTimeout(() => fetchLessons(), retryDelay * Math.pow(2, retryCount));
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLessons();
  }, [retryCount]);
  
  const handleNewLesson = () => {
    router.push('/lessons/new');
  };
  
  const handleRetry = () => {
    setRetryCount(0); // Reset retry count to trigger a new fetch attempt
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading lessons...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-md flex flex-col items-center">
        <p className="mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={handleRetry}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lessons
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage your lessons
          </p>
        </div>
        {user && (
          <Button onClick={handleNewLesson}>
            <Plus className="mr-2 h-4 w-4" />
            New Lesson
          </Button>
        )}
      </div>
      
      {lessons.length > 0 ? (
        <LessonGrid lessons={lessons} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No lessons found</p>
          {user && (
            <Button onClick={handleNewLesson}>Create your first lesson</Button>
          )}
        </div>
      )}
    </>
  );
}
