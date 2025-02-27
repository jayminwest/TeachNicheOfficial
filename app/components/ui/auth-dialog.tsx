'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from './dialog'
import { SignInPage } from './sign-in'
import { SignUpPage } from './sign-up'
import authService from '@/app/services/auth/auth-provider'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'sign-in' | 'sign-up'
}

export function AuthDialog({ open, onOpenChange, defaultView = 'sign-in' }: AuthDialogProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 bg-background" data-testid="auth-dialog" id="auth-dialog">
        <div className="px-6 pt-6">
          <h2 className="text-lg font-semibold">
            {view === 'sign-in' ? 'Sign in to Teach Niche' : 'Join Teach Niche'}
          </h2>
        </div>
        {view === 'sign-in' ? (
          <SignInPage 
            onSwitchToSignUp={() => setView('sign-up')} 
            onSignIn={handleSignIn}
          />
        ) : (
          <SignUpPage 
            onSwitchToSignIn={() => setView('sign-in')} 
            onSignUp={handleSignUp}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
