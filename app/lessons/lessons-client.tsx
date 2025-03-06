'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { LessonGrid } from '@/app/components/ui/lesson-grid';
import { Button } from '@/app/components/ui/button';
import { Loader2, Plus, RefreshCw } from 'lucide-react';

interface LessonsClientProps {
  initialLessons?: Array<Record<string, unknown>>; // Define props that might be used in the future
}

export default function LessonsClient({}: LessonsClientProps) {
  // State variables for lessons management
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const hasInitialFetchRef = useRef(false);
  const DEBUG = process.env.NODE_ENV === 'development';
  const { user } = useAuth();
  const router = useRouter();
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Define fetchLessons outside useEffect and memoize it
  const fetchLessons = useCallback(async () => {
    // Remove the loading guard to allow initial fetch
    if (DEBUG) console.log('fetchLessons called');
    
    // Create a loading ref for this specific fetch operation
    const isLoadingRef = { current: true };
    try {
      // Update UI loading state
      setIsLoading(true);
      // Update internal ref
      isLoadingRef.current = true;
      setError(null);
      
      console.log('Fetching lessons...');
      
      // Use AbortController to set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Use a try-catch block specifically for the fetch operation
      try {
        const response = await fetch('/api/lessons', {
          // Add cache control headers
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      
        if (!response.ok) {
          let errorMessage = `Server error: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Lessons fetched successfully:', Array.isArray(data) ? data.length : 'Not an array');
        console.log('Response data type:', typeof data);
        console.log('First lesson sample:', Array.isArray(data) && data.length > 0 ? JSON.stringify(data[0], null, 2) : 'No lessons');
        
        // Ensure we're working with an array of lessons
        if (Array.isArray(data)) {
          setLessons(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.lessons)) {
          // Handle case where API returns { lessons: [...] }
          setLessons(data.lessons);
        } else if (data && typeof data === 'object' && data.error) {
          // Handle error response from API
          throw new Error(data.error);
        } else {
          console.error('Unexpected data format from API:', data);
          // Try to convert to array if possible
          const fallbackData = data && typeof data === 'object' ? Object.values(data) : [];
          // @ts-expect-error - fallbackData[0] might not have an id property
          if (Array.isArray(fallbackData) && fallbackData.length > 0 && fallbackData[0]?.id) {
            console.log('Converted object to array successfully');
            setLessons(fallbackData);
          } else {
            setLessons([]);
            throw new Error('Invalid data format received from server');
          }
        }
      } catch (fetchError) {
        // Handle network errors separately
        clearTimeout(timeoutId);
        console.error('Network error during fetch:', fetchError);
        throw fetchError; // Re-throw to be caught by the outer catch block
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
      
      // Handle different types of errors
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.message === 'Failed to fetch') {
        setError('Network error: Could not connect to the server. Please check your internet connection and try again.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load lessons: ${errorMessage}`);
      }
      
      // Define constants for retry logic
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second base delay
      
      // Auto-retry logic
      if (retryCount < maxRetries) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        console.log(`Retrying (${nextRetry}/${maxRetries}) in ${retryDelay * Math.pow(2, retryCount)}ms...`);
        
        // Only retry if component is still mounted
        setTimeout(() => {
          fetchLessons();
        }, retryDelay * Math.pow(2, retryCount));
      }
    } finally {
      // Update internal ref first
      isLoadingRef.current = false;
      // Then update UI state
      setIsLoading(false);
    }
  }, [retryCount, DEBUG]); // Minimize dependencies to prevent unnecessary re-renders
  
  // Separate useEffect for the initial fetch
  useEffect(() => {
    // Don't fetch if not mounted (client-side only) or if we've already fetched
    if (!mounted || hasInitialFetchRef.current) return;
    
    if (DEBUG) console.log('Initial fetch useEffect triggered');
    
    // Mark that we've started the initial fetch
    hasInitialFetchRef.current = true;
    
    // Add safety timeout for loading state
    const loadingTimeout = setTimeout(() => {
      console.warn('Lessons loading timeout triggered');
      setIsLoading(false);
      setError('Loading timeout - please try again');
    }, 10000); // 10 second timeout
    
    // Trigger fetch immediately
    fetchLessons();
    
    // Clear timeout on cleanup
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [mounted, fetchLessons, DEBUG]);
  
  const handleNewLesson = () => {
    router.push('/lessons/new');
  };
  
  const handleRetry = () => {
    if (DEBUG) console.log('Manual retry triggered');
    // Call fetchLessons directly instead of using retryCount
    fetchLessons();
  };
  
  // Show loading skeleton if not mounted yet (server-side)
  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-10 w-40 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-5 w-64 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <div className="aspect-video bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
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
