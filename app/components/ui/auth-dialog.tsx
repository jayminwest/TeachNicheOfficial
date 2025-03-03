'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { SignInPage } from './sign-in'
import { useAuth } from '@/app/services/auth/AuthContext'
import { useSearchParams } from 'next/navigation'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  onSuccess?: () => void
}

export function AuthDialog({ 
  open, 
  onOpenChange, 
  onSuccess
}: AuthDialogProps) {
  const { isAuthenticated, loading, error: authError } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  
  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && open) {
      onOpenChange(false)
      onSuccess?.()
    }
  }, [isAuthenticated, open, onOpenChange, onSuccess])

  // Handle URL parameters for OAuth callbacks and errors
  useEffect(() => {
    if (searchParams) {
      const errorParam = searchParams.get('error')
      if (errorParam && open) {
        setError(errorParam)
      }
    }
  }, [searchParams, open])

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
        ) : authError || error ? (
          <div className="p-6 text-destructive" data-testid="auth-error">
            {authError?.message || error || 'An error occurred during authentication'}
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
