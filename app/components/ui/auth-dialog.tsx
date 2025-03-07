'use client'

import { useEffect, useState, Suspense } from 'react'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { SignInPage } from './sign-in'
import { useAuth } from '@/app/services/auth/AuthContext'
import { useSearchParams } from 'next/navigation'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  defaultView?: 'sign-in' | 'sign-up'
}

// Component that uses searchParams
function AuthDialogContent({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultView = 'sign-in'
}: AuthDialogProps) {
  const { isAuthenticated, loading, error: authError } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [view] = useState(defaultView)
  const searchParams = useSearchParams()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  
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
    
    // Store current path for redirection after auth
    if (open && typeof window !== 'undefined') {
      setRedirectPath(window.location.pathname)
      // Set cookie for server-side access
      document.cookie = `auth_redirect=${window.location.pathname};path=/;max-age=300;SameSite=Lax`
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
            initialView={view}
            redirectPath={redirectPath}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// Export the wrapped component with Suspense
export function AuthDialog(props: AuthDialogProps) {
  return (
    <Suspense fallback={
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="p-0 w-[425px]" data-testid="auth-dialog">
          <DialogTitle className="px-6 pt-6" data-testid="auth-dialog-title">
            Sign in to Teach Niche
          </DialogTitle>
          <div className="p-6 flex justify-center" data-testid="auth-loading">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    }>
      <AuthDialogContent {...props} />
    </Suspense>
  )
}
