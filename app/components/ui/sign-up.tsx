'use client'

import { useState } from 'react'
import { Button } from './button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from './card'
import { Icons } from './icons'
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth'
import { VisuallyHidden } from './visually-hidden'

interface SignUpPageProps {
  onSignUpSuccess?: () => void;
}

export function SignUpPage({ onSignUpSuccess }: SignUpPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // We use the same signInWithGoogle function as it handles both sign-in and sign-up
      const result = await signInWithGoogle()
      
      if (result?.error) {
        throw result.error;
      }
      
      // Success callback
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
      
      // Safety timeout
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[inherit] items-center justify-center p-6">
      <Card className="w-full max-w-[400px] mx-auto">
        <CardHeader className="space-y-1">
          <CardDescription>Create your account with Google</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              type="button" 
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <Icons.spinner data-testid="spinner-icon" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-4 w-4" />
              )}
              Sign up with Google
            </Button>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
