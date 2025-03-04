'use client'

import { useState, useEffect, useCallback } from 'react'
import { LessonRequest } from '@/app/lib/schemas/lesson-request'
import { getRequests } from '@/app/lib/supabase/requests'
import { useAuth } from '@/app/services/auth/AuthContext'
import { RequestCard } from './request-card'
import { Loader2 } from 'lucide-react'
import { toast } from '@/app/components/ui/use-toast'
import { Button } from '@/app/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface RequestGridProps {
  initialRequests?: LessonRequest[]
  category?: string
  sortBy?: 'popular' | 'newest'
  onError?: (error: Error) => void
}

export function RequestGrid({ initialRequests, category, sortBy = 'popular', onError }: RequestGridProps) {
  const [requests, setRequests] = useState<LessonRequest[]>(initialRequests || [])
  const [isLoading, setIsLoading] = useState(!initialRequests)
  const { user } = useAuth()

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getRequests({ category, sortBy })
      setRequests(data)
    } catch (error) {
      // Improved error handling with detailed logging
      const errorDetails = typeof error === 'object' 
        ? JSON.stringify(error, Object.getOwnPropertyNames(error)) 
        : String(error);
      
      // Check for specific Supabase JWT error
      let userMessage = 'Failed to load requests';
      let shouldRefreshAuth = false;
      
      if (errorDetails.includes('JWSError') || 
          errorDetails.includes('Not valid base64url') ||
          errorDetails.includes('JWT')) {
        userMessage = 'Authentication error. Please try signing out and signing back in.';
        shouldRefreshAuth = true;
        console.error('Supabase JWT validation error detected:', { 
          error, 
          errorType: typeof error,
          errorDetails
        });
        
        // Attempt to refresh the session
        try {
          const supabase = createClientComponentClient();
          await supabase.auth.refreshSession();
          // If successful, try loading again
          const data = await getRequests({ category, sortBy });
          setRequests(data);
          return; // Exit early if successful
        } catch (refreshError) {
          console.error('Failed to refresh authentication:', refreshError);
          // Continue with the original error handling
        }
      } else {
        const errorMessage = error instanceof Error 
          ? error.message 
          : `Unknown error (${errorDetails})`;
        
        console.error('Failed to load requests:', { 
          error, 
          errorType: typeof error,
          errorDetails
        });
        
        userMessage = `Failed to load requests: ${errorMessage}`;
      }
      
      onError?.(new Error(userMessage));
      
      // Show toast for authentication errors
      if (shouldRefreshAuth) {
        toast({
          title: "Authentication Error",
          description: userMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false)
    }
  }, [category, sortBy, onError])

  useEffect(() => {
    if (!initialRequests) {
      loadRequests();
    }
  }, [category, sortBy, initialRequests, loadRequests])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 data-testid="loading-spinner" className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!isLoading && requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No lesson requests found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 p-4">
      {requests.map(request => (
        <RequestCard 
          key={request.id} 
          request={request}
          onVote={loadRequests}
          currentUserId={user?.id}
        />
      ))}
    </div>
  )
}
