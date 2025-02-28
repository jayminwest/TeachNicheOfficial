'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from './dialog'
import { SignInPage } from './sign-in'
import { SignUpPage } from './sign-up'
import { signInWithEmail, signUp } from '@/app/services/auth/firebase-auth-service'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'sign-in' | 'sign-up'
}

export function AuthDialog({ open, onOpenChange, defaultView = 'sign-in' }: AuthDialogProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView)
  const router = useRouter()

  // Add these handlers to pass to the sign-in and sign-up components
  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        throw result.error;
      }
      onOpenChange(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      const result = await signUp(email, password, name);
      if (result.error) {
        throw result.error;
      }
      onOpenChange(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

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
