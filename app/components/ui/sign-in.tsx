import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      await signInWithGoogle()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    }
  }

  return (
    <>
      {loading ? (
        <div className="flex min-h-[inherit] w-full items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : user ? (
        <>{router.push('/dashboard')}</>
      ) : (
        <div className="flex min-h-[inherit] w-full items-center justify-center p-6">
          <Card className="w-full max-w-[400px]">
            <CardHeader className="space-y-1">
              <CardTitle>Sign in to Teach Niche</CardTitle>
              <CardDescription>Welcome back! Please sign in to continue</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
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
