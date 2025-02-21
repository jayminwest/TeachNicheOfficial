'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ThumbsUp } from 'lucide-react'
import { LessonRequest } from '@/app/lib/schemas/lesson-request'
import { useAuth } from '@/app/services/auth/AuthContext'
import { toast } from '@/app/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface RequestCardProps {
  request: LessonRequest
  onVote: () => void
}

export function RequestCard({ request, onVote }: RequestCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(request.vote_count)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  // Fetch current vote count from Supabase
  const updateVoteCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('lesson_request_votes')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', request.id);
      
      if (error) throw error;
      
      // Use a function to update state to avoid race conditions
      setVoteCount(prev => count ?? prev);
    } catch (error) {
      console.error('Error fetching vote count:', error);
    }
  }, [supabase, request.id]);

  // Update vote count on mount and after votes
  useEffect(() => {
    updateVoteCount();
  }, [updateVoteCount]);

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
        setShowAuth(true)
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
            vote_type: 'up' as const
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
    } catch (error) {
      console.error('Vote failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit vote. Please try again.",
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
    <AuthDialog 
      open={showAuth} 
      onOpenChange={setShowAuth}
      defaultView="sign-up"
    />
  )
}
