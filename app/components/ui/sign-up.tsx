import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/app/components/ui/card'
import { Icons } from '@/app/components/ui/icons'
import { signInWithGoogle, onAuthStateChange, getSession } from '@/app/services/auth/supabaseAuth'
import { useAuth } from '@/app/services/auth/AuthContext'
import { VisuallyHidden } from '@/app/components/ui/visually-hidden'

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
}

function SignUpPage({ onSwitchToSignIn }: SignUpPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { loading, user } = useAuth()

  // Listen for auth state changes to handle redirection
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session);
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, redirecting to dashboard');
          if (typeof window !== 'undefined' && window.nextRouterMock) {
            window.nextRouterMock.push('/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // For testing - set a flag that we can detect in tests
      if (typeof window !== 'undefined') {
        window.signInWithGoogleCalled = true;
      }
      
      console.log('Starting Google sign-up process...');
      const result = await signInWithGoogle()
      
      if (result?.error) {
        // Check for specific provider not enabled error
        const errorMessage = result.error.message || '';
        if (errorMessage.includes('provider is not enabled') || 
            errorMessage.includes('Unsupported provider')) {
          throw new Error('Google sign-in is not configured. Please enable Google provider in Supabase dashboard.');
        }
        throw result.error;
      }
      
      console.log('Google sign-up initiated successfully');
      
      // Check if we have a session
      const { data: { session } } = await getSession();
      console.log('Session after sign-up attempt:', !!session);
      
      // We don't redirect here - the onAuthStateChange listener will handle it
      // Keep loading state until auth state change or timeout
      setTimeout(() => {
        setIsLoading(false);
      }, 5000); // Safety timeout in case auth state doesn't change
      
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google')
      setIsLoading(false)
    }
  }

  return (
    <>
      {loading ? (
        <div className="flex min-h-[inherit] w-full items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <VisuallyHidden>Loading authentication status</VisuallyHidden>
            <p>Loading...</p>
          </div>
        </div>
      ) : user ? (
        <>{router.push('/')}</>
      ) : (
        <div className="flex min-h-[inherit] items-center justify-center p-6">
          <Card className="w-full max-w-[400px] mx-auto">
            <CardHeader className="space-y-1">
              <CardDescription>
                Create an account to get started with Teach Niche
              </CardDescription>
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
                    <Icons.spinner data-testid="spinner" className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                  )}
                  Sign up with Google
                </Button>
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={onSwitchToSignIn}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSwitchToSignIn();
                      }
                    }}
                    className="text-sm"
                  >
                    Already have an account? Sign in
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export { SignUpPage };
