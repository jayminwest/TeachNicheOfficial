'use client'

import { Button } from '@/app/components/ui/button'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'

interface SignInToVoteProps {
  voteCount: number
  className?: string
  onSignInSuccess?: () => void
}

export function SignInToVote({ voteCount, className, onSignInSuccess }: SignInToVoteProps) {
  const [showAuth, setShowAuth] = useState(false)
  
  const handleAuthSuccess = () => {
    setShowAuth(false)
    onSignInSuccess?.()
  }
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAuth(true)}
        className={className}
      >
        <ThumbsUp className="w-4 h-4 mr-2 stroke-[1.5]" />
        <span className="font-medium">{voteCount}</span>
        <span className="ml-1 text-xs text-muted-foreground">
          {voteCount === 1 ? 'vote' : 'votes'}
        </span>
      </Button>
      
      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth}
        onSuccess={handleAuthSuccess}
        defaultView="sign-up"
      />
    </>
  )
}
