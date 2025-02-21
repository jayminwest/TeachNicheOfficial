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
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(request.vote_count)
  const supabase = createClientComponentClient()
  const { user, loading } = useAuth()

  // Fetch current vote count from Supabase
  const updateVoteCount = async () => {
    const { data, error } = await supabase
      .from('lesson_request_votes')
      .select('*')
      .eq('request_id', request.id)
      .count();
    
    if (error) {
      console.error('Error fetching vote count:', error);
      return;
    }
    
    setVoteCount(data?.[0]?.count || 0);
  }

  // Update vote count on mount and after votes
  useEffect(() => {
    updateVoteCount();
  }, [request.id]);

  useEffect(() => {
    async function checkVoteStatus() {
      if (!user) return;
      
      const { data } = await supabase
        .from('lesson_request_votes')
        .select()
        .match({ request_id: request.id, user_id: user.id })
        .maybeSingle();
      
      setHasVoted(!!data);
    }

    checkVoteStatus();
  }, [user, request.id, supabase]);

  const handleVote = async () => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to vote on requests",
          variant: "destructive"
        })
        return
      }

      setIsVoting(true);
      
      // Check if vote exists
      const { data: existingVote, error: queryError } = await supabase
        .from('lesson_request_votes')
        .select()
        .match({ request_id: request.id, user_id: user.id })
        .maybeSingle();

      if (queryError) throw queryError;

      if (existingVote) {
        // Remove vote if it exists
        const { error: deleteError } = await supabase
          .from('lesson_request_votes')
          .delete()
          .eq('request_id', request.id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        
        setHasVoted(false);
        setVoteCount(prev => prev - 1);
        
        toast({
          title: "Success",
          description: "Vote removed",
        });
      } else {
        // Add vote if it doesn't exist
        const { error: insertError } = await supabase
          .from('lesson_request_votes')
          .insert({
            request_id: request.id,
            user_id: user.id,
            vote_type: 'up'
          });

        if (insertError) throw insertError;
        
        setHasVoted(true);
        setVoteCount(prev => prev + 1);
        
        toast({
          title: "Success",
          description: "Vote added",
        });
      }
      
      await updateVoteCount();
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
            onClick={handleVote}
            disabled={isVoting}
            aria-label="thumbs up"
          >
            <ThumbsUp className={`w-4 h-4 mr-1 ${hasVoted ? 'fill-current text-primary' : ''}`} />
            <span>{voteCount}</span>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Status: {request.status}
        </div>
      </CardFooter>
    </Card>
  )
}
