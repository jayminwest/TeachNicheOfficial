'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ThumbsUp } from 'lucide-react'
import { LessonRequest } from '@/lib/types'
import { voteOnRequest } from '@/lib/supabase/requests'
import { useAuth } from '@/auth/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface RequestCardProps {
  request: LessonRequest
  onVote: () => void
}

export function RequestCard({ request, onVote }: RequestCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const supabase = createClientComponentClient()
  const { user, loading } = useAuth()

  const handleVote = async (type: 'upvote' | 'downvote') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to vote on requests",
          variant: "destructive"
        })
        return
      }

      setIsVoting(true);
      console.log('Calling voteOnRequest with:', { requestId: request.id, type });
      await voteOnRequest(request.id, type);
      console.log('Vote successful');
      onVote();
    } catch (error: any) {
      console.error('Vote failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{request.title}</CardTitle>
        <div className="text-sm text-muted-foreground" suppressHydrationWarning>
          {new Date(request.created_at).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">
            {request.category}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Button clicked - attempting vote:', request.id);
              handleVote('upvote');
            }}
            disabled={isVoting}
            aria-label="thumbs up"
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            <span>{request.vote_count}</span>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Status: {request.status}
        </div>
      </CardFooter>
    </Card>
  )
}
