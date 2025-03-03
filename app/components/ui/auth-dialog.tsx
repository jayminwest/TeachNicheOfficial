'use client'

import { useState, useEffect } from 'react'
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
  provider?: string
}

export function AuthDialog({ 
  open, 
  onOpenChange, 
  defaultView = 'sign-in',
  title = 'Authentication',
  onSuccess,
  provider
}: AuthDialogProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView)
  const { isAuthenticated, isLoading, error } = useAuth()
  
  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && open) {
      onOpenChange(false)
      onSuccess?.()
    }
  }, [isAuthenticated, open, onOpenChange, onSuccess])

  // Handle URL parameters for OAuth callbacks
  useEffect(() => {
    // Check if we're in a callback situation with error parameters
    const url = new URL(window.location.href)
    const errorParam = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    
    if (errorParam && open) {
      console.error('OAuth error:', errorParam, errorDescription)
      // Could display error message to user here
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-[425px]" data-testid="auth-dialog">
        <DialogTitle className="px-6 pt-6" data-testid="auth-dialog-title">
          {view === 'sign-in' ? 'Sign in to Teach Niche' : 'Join Teach Niche'}
        </DialogTitle>
        {isLoading ? (
          <div className="p-6 flex justify-center" data-testid="auth-loading">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-destructive" data-testid="auth-error">
            {error.message || 'An error occurred during authentication'}
          </div>
        ) : view === 'sign-in' ? (
          <SignInPage 
            onSwitchToSignUp={() => setView('sign-up')} 
            onSignInSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
            initialProvider={provider}
          />
        ) : (
          <SignUpPage 
            onSwitchToSignIn={() => setView('sign-in')} 
            onSignInSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
            initialProvider={provider}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
