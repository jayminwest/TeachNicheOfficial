'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ThumbsUp, Edit2 } from 'lucide-react'
import { LessonRequest } from '@/app/lib/schemas/lesson-request'
import { RequestDialog } from './request-dialog'
import { useAuth } from '@/app/services/auth/AuthContext'
import { toast } from '@/app/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { voteOnRequest } from '@/app/lib/supabase/requests'
import { SignInToVote } from './sign-in-to-vote'

interface RequestCardProps {
  request: LessonRequest
  onVote: () => void
  currentUserId?: string
}

export function RequestCard({ request, onVote, currentUserId }: RequestCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(request.vote_count)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClientComponentClient()
  const { user } = useAuth();

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
        .eq('request_id', request.id)
        .eq('user_id', user.id)
        .single();
      
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
      
      // Optimistic UI update
      const isRemovingVote = hasVoted;
      const newVoteCount = isRemovingVote ? voteCount - 1 : voteCount + 1;
      const originalVoteCount = voteCount;
      const originalHasVoted = hasVoted;
      
      // Update UI optimistically
      setHasVoted(!isRemovingVote);
      setVoteCount(newVoteCount);
      
      try {
        // Use the API route through the voteOnRequest function
        const result = await voteOnRequest(request.id, 'up');
        
        if (!result.success) {
          // Revert optimistic update on error
          setHasVoted(originalHasVoted);
          setVoteCount(originalVoteCount);
          
          // If the error is authentication related, show auth dialog
          if (result.error === 'unauthenticated') {
            setShowAuth(true);
          }
          return;
        }
        
        // Update with the actual vote count from the server
        setVoteCount(result.currentVotes);
        setHasVoted(result.userHasVoted);
        
        // Notify parent component about the vote
        onVote();
      } catch (error) {
        console.error('Vote operation failed:', error);
        
        // Log more details about the error
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else {
          console.error('Non-Error object thrown:', typeof error, error);
        }
        
        // Revert optimistic update on error
        setHasVoted(originalHasVoted);
        setVoteCount(originalVoteCount);
        
        // Show appropriate error message
        if (error instanceof Error) {
          toast({
            title: "Error",
            description: error.message || "Failed to submit vote. Please try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive"
          });
        }
        
        // Force a refresh of the vote count from the server
        updateVoteCount();
      }
    } finally {
      setIsVoting(false);
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
          <div className="flex gap-2 items-center">
            <div className="flex gap-2">
              {currentUserId === request.user_id && (
                <RequestDialog request={request} mode="edit">
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                </RequestDialog>
              )}
            </div>
            {user ? (
              <Button
                variant={hasVoted ? "default" : "outline"}
                size="sm"
                onClick={handleVote}
                disabled={isVoting}
                className="transition-all duration-200 hover:scale-105"
              >
                <ThumbsUp className={`w-4 h-4 mr-2 transition-transform group-hover:scale-110 ${
                  hasVoted ? 'fill-current text-black' : 'stroke-white stroke-[1.5]'
                }`} />
                <span className="font-medium">{voteCount}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {voteCount === 1 ? 'vote' : 'votes'}
                </span>
              </Button>
            ) : (
              <SignInToVote 
                voteCount={voteCount}
                className="transition-all duration-200 hover:scale-105"
                onSignInSuccess={() => {
                  // Refresh the component after sign in
                  updateVoteCount();
                }}
              />
            )}
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
