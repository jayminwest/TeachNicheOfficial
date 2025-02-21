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
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold line-clamp-2 hover:line-clamp-none transition-all">
              {request.title}
            </CardTitle>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              request.status === 'completed' ? 'bg-green-100 text-green-800' :
              request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {request.status.replace('_', ' ')}
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
              {new Date(request.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span className="text-sm h-[20px]"> {/* Fixed height placeholder */}
              {request.instagram_handle && (
                <a 
                  href={`https://instagram.com/${request.instagram_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {request.instagram_handle}
                </a>
              )}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3 group-hover:line-clamp-none transition-all">
            {request.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {request.category}
            </span>
            {request.tags?.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-3 flex justify-between items-center border-t">
          <Button
            variant={hasVoted ? "default" : "outline"}
            size="sm"
            onClick={handleVote}
            disabled={isVoting}
            className="transition-all duration-200 hover:scale-105"
          >
            <ThumbsUp className={`w-4 h-4 mr-2 transition-transform group-hover:scale-110 ${
              hasVoted ? 'fill-current text-primary' : ''
            }`} />
            <span className="font-medium">{voteCount}</span>
            <span className="ml-1 text-xs text-muted-foreground">
              {voteCount === 1 ? 'vote' : 'votes'}
            </span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              ID: {request.id.slice(0, 8)}
            </span>
          </div>
        </CardFooter>
      </Card>
      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth}
        defaultView="sign-up"
      />
    </>
  )
}
