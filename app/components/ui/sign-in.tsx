import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Button } from './button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card'
import { Icons } from './icons'
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth'
import { useAuth } from '@/app/services/auth/AuthContext'
import { VisuallyHidden } from './visually-hidden'
import { cn } from '@/app/lib/utils'

interface SignInPageProps {
  onSignInSuccess?: () => void;
  initialView?: 'sign-in' | 'sign-up';
  onSwitchToSignUp?: () => void;
  redirectPath?: string | null;
}

// Export the wrapped component with Suspense
function SignInPage(props: SignInPageProps) {
  return (
    <Suspense fallback={
      <div className="flex min-h-[inherit] w-full items-center justify-center">
        <div className="text-center">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <VisuallyHidden>Loading authentication status</VisuallyHidden>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <SignInPageContent {...props} />
    </Suspense>
  );
}

function SignInPageContent({ onSignInSuccess, redirectPath, className }: SignInPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const errorParam = searchParams?.get('error')
  
  // Handle redirection after sign-in
  useEffect(() => {
    if (user) {
      // Call the success callback to close the dialog
      onSignInSuccess?.();
      
      // Check if there's a redirect URL in the query params
      const redirectTo = searchParams?.get('redirect');
      
      if (redirectTo) {
        // Decode the URL if it's encoded
        const decodedRedirect = decodeURIComponent(redirectTo);
        window.location.href = decodedRedirect;
      } else {
        router.push('/profile');
      }
    }
  }, [user, router, onSignInSuccess, searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // For testing - set a flag that we can detect in tests
      if (typeof window !== 'undefined') {
        // Add property to window object for testing
        (window as Window & typeof globalThis & { signInWithGoogleCalled: boolean }).signInWithGoogleCalled = true;
        
        // Store redirect path in cookie if provided
        if (redirectPath) {
          document.cookie = `auth_redirect=${redirectPath};path=/;max-age=300;SameSite=Lax`;
        }
      }
      
      const result = await signInWithGoogle()
      
      if (result?.error) {
        throw result.error;
      }
      
      // We don't redirect here - the useEffect with user dependency will handle it
      // Keep loading state for a short time to allow auth state to update
      setTimeout(() => {
        setIsLoading(false);
      }, 2000); // Safety timeout in case auth state doesn't change
      
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  }

  // If user is already authenticated, redirect to profile
  if (user) {
    router.push('/profile');
    return null;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-[inherit] w-full items-center justify-center">
        <div className="text-center">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <VisuallyHidden>Loading authentication status</VisuallyHidden>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in UI
  return (
    <div data-testid="sign-in-container" className={cn("flex min-h-[inherit] items-center justify-center p-6", className)}>
      <Card className="w-full max-w-[400px] mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle>Sign in to Teach Niche</CardTitle>
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
            {(error || errorParam) && (
              <p className="text-sm text-red-500 text-center">
                {error || "There was a problem signing you in"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export both components
export { SignInPage, SignInPageContent as SignIn };
