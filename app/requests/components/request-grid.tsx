'use client'

import { useState, useEffect, useCallback } from 'react'
import { LessonRequest } from '@/app/lib/schemas/lesson-request'
import { getRequests } from '@/app/lib/supabase/requests'
import { RequestCard } from './request-card'
import { Loader2 } from 'lucide-react'

interface RequestGridProps {
  initialRequests?: LessonRequest[]
  category?: string
  sortBy: 'popular' | 'newest'
}

export function RequestGrid({ initialRequests, category, sortBy }: RequestGridProps) {
  const [requests, setRequests] = useState<LessonRequest[]>(initialRequests || [])
  const [isLoading, setIsLoading] = useState(!initialRequests)

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getRequests({ category, sortBy })
      setRequests(data)
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [category])

  useEffect(() => {
    if (!initialRequests) {
      const load = async () => {
        try {
          setIsLoading(true)
          const data = await getRequests({ category, sortBy })
          setRequests(data)
        } catch (error) {
          console.error('Failed to load requests:', error)
        } finally {
          setIsLoading(false)
        }
      }
      load()
    }
  }, [category, initialRequests])

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
        />
      ))}
    </div>
  )
}
