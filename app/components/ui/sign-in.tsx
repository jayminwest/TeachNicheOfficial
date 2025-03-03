import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Button } from './button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from './card'
import { Icons } from './icons'
import { signInWithGoogle, onAuthStateChange } from '@/app/services/auth/supabaseAuth'
import { useAuth } from '@/app/services/auth/AuthContext'
import { VisuallyHidden } from './visually-hidden'

interface SignInPageProps {
  onSignInSuccess?: () => void;
  initialView?: 'sign-in' | 'sign-up';
}

function SignInPage({ onSignInSuccess, initialView = 'sign-in' }: SignInPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  
  // Use initialView to set up initial UI state if needed
  useEffect(() => {
    console.log(`Initial view set to: ${initialView}`);
    // Future implementation can use this to switch between sign-in/sign-up views
  }, [initialView]);

  // Listen for auth state changes to handle redirection
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Call the success callback to close the dialog
          if (onSignInSuccess) {
            onSignInSuccess();
          }
          
          // Check if there's a redirect URL in the query params
          if (typeof window !== 'undefined') {
            const redirectTo = searchParams?.get('redirect');
            
            if (redirectTo) {
              window.location.href = redirectTo;
            } else {
              router.push('/profile');
            }
          }
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [router, onSignInSuccess, searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // For testing - set a flag that we can detect in tests
      if (typeof window !== 'undefined') {
        // Add property to window object for testing
        (window as any).signInWithGoogleCalled = true;
      }
      
      // Add the redirect_to parameter to the OAuth URL
      const result = await signInWithGoogle()
      
      if (result?.error) {
        throw result.error;
      }
      
      // We don't redirect here - the onAuthStateChange listener will handle it
      // Keep loading state until auth state change or timeout
      setTimeout(() => {
        setIsLoading(false);
      }, 5000); // Safety timeout in case auth state doesn't change
      
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <div className="flex min-h-[inherit] w-full items-center justify-center">
          <div className="text-center">
            <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <VisuallyHidden>Loading authentication status</VisuallyHidden>
            <p>Loading...</p>
          </div>
        </div>
      ) : user ? (
        <>{router.push('/profile')}</>
      ) : (
        <div className="flex min-h-[inherit] items-center justify-center p-6">
          <Card className="w-full max-w-[400px] mx-auto">
            <CardHeader className="space-y-1">
              <CardDescription>Sign in with your Google account</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4">
                <Button 
                  size="lg" 
                  variant="outline" 
                  type="button" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Icons.spinner data-testid="spinner-icon" className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                  )}
                  Sign in with Google
                </Button>
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export { SignInPage };
