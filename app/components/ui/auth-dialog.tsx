'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { SignInPage } from './sign-in'
import { SignUpPage } from './sign-up'
import { useAuth } from '@/app/services/auth/AuthContext'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'sign-in' | 'sign-up'
  title?: string
  onSuccess?: () => void
}

export function AuthDialog({ 
  open, 
  onOpenChange, 
  defaultView = 'sign-in',
  title = 'Authentication',
  onSuccess
}: AuthDialogProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView)
  const { isAuthenticated } = useAuth()
  
  // Close dialog when user is authenticated
  if (isAuthenticated && open) {
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-[425px]" data-testid="auth-dialog">
        <DialogTitle className="px-6 pt-6">
          {view === 'sign-in' ? 'Sign in to Teach Niche' : 'Join Teach Niche'}
        </DialogTitle>
        {view === 'sign-in' ? (
          <SignInPage 
            onSwitchToSignUp={() => setView('sign-up')} 
            onSignInSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
          />
        ) : (
          <SignUpPage 
            onSwitchToSignIn={() => setView('sign-in')} 
            onSignInSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
