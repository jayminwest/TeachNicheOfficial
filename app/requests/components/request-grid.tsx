'use client'

import { useState, useEffect } from 'react'
import { LessonRequest } from '@/lib/types'
import { getRequests } from '@/lib/supabase/requests'
import { RequestCard } from './request-card'
import { Loader2 } from 'lucide-react'

interface RequestGridProps {
  initialRequests?: LessonRequest[]
  category?: string
}

export function RequestGrid({ initialRequests, category }: RequestGridProps) {
  const [requests, setRequests] = useState<LessonRequest[]>(initialRequests || [])
  const [isLoading, setIsLoading] = useState(!initialRequests)

  const loadRequests = async () => {
    try {
      setIsLoading(true)
      const data = await getRequests({ category })
      setRequests(data)
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!initialRequests) {
      loadRequests()
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
