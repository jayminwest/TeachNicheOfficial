import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'
import { Input } from './input'
import { Label } from './label'
import { Icons } from './icons'
import { signInWithEmail, signInWithGoogle } from '@/auth/supabaseAuth'
import { useAuth } from '@/auth/AuthContext'

interface SignInPageProps {
  onSwitchToSignUp: () => void;
}

function SignInPage({ onSwitchToSignUp }: SignInPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await signInWithEmail(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }


  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      router.push('/dashboard')
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
        <CardContent className="grid gap-4">
          <form onSubmit={handleSignIn} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4">
              <Button size="sm" variant="outline" type="button" className="h-7" onClick={handleGoogleSignIn}>
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="link" 
            size="sm" 
            className="w-full"
            onClick={onSwitchToSignUp}
          >
            Don&apos;t have an account? Sign up
          </Button>
        </CardFooter>
      </Card>
        </div>
      )}
    </>
  )
}

export { SignInPage };
