import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from './card'
import { Icons } from './icons'
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth'
import { useAuth } from '@/app/services/auth/AuthContext'

interface SignInPageProps {
  onSwitchToSignUp: () => void;
}

function SignInPage({ onSwitchToSignUp }: SignInPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.error) {
        throw result.error
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {loading ? (
        <div className="flex min-h-[inherit] w-full items-center justify-center">
          <div className="text-center">
            <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : user ? (
        <>{router.push('/dashboard')}</>
      ) : (
        <div className="flex min-h-[inherit] w-full items-center justify-center p-6">
          <Card className="w-full max-w-[400px]">
            <CardHeader className="space-y-1">
              <CardDescription>Welcome back! Please sign in to continue</CardDescription>
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
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={onSwitchToSignUp}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSwitchToSignUp();
                      }
                    }}
                    className="text-sm"
                  >
                    Don&apos;t have an account? Sign up
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

export { SignInPage };
