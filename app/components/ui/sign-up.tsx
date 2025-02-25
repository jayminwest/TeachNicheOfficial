import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/app/components/ui/card'
import { Icons } from '@/app/components/ui/icons'
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth'
import { useAuth } from '@/app/services/auth/AuthContext'

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
}

function SignUpPage({ onSwitchToSignIn }: SignUpPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { loading, user } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google')
    }
    setIsLoading(false)
  }

  return (
    <>
      {loading ? (
        <div className="flex min-h-[inherit] w-full items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <h1 className="sr-only">Loading</h1>
            <p>Loading...</p>
          </div>
        </div>
      ) : user ? (
        <>{router.push('/')}</>
      ) : (
        <div className="flex min-h-[inherit] w-full items-center justify-center p-6">
          <Card className="w-full max-w-[400px]">
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
