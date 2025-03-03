'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { SignInPage } from './sign-in'
import { useAuth } from '@/app/services/auth/AuthContext'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  onSuccess?: () => void
}

export function AuthDialog({ 
  open, 
  onOpenChange, 
  title = 'Authentication',
  onSuccess
}: AuthDialogProps) {
  const { isAuthenticated, loading, error } = useAuth()
  
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
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const errorParam = url.searchParams.get('error')
      const errorDescription = url.searchParams.get('error_description')
      
      if (errorParam && open) {
        console.error('OAuth error:', errorParam, errorDescription)
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-[425px]" data-testid="auth-dialog">
        <DialogTitle className="px-6 pt-6" data-testid="auth-dialog-title">
          Sign in to Teach Niche
        </DialogTitle>
        {loading ? (
          <div className="p-6 flex justify-center" data-testid="auth-loading">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-destructive" data-testid="auth-error">
            {error.message || 'An error occurred during authentication'}
          </div>
        ) : (
          <SignInPage 
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
