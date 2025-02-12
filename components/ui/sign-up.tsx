import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { signUp, signInWithGithub, signInWithGoogle } from '@/auth/supabaseAuth'

interface SignUpPageProps {
  onSwitchToSignIn: () => void;
}

function SignUpPage({ onSwitchToSignIn }: SignUpPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    // Successful signup
    router.push('/') // or wherever you want to redirect
  }

  const handleGithubSignIn = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await signInWithGithub()
    if (error) setError(error.message)
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-[inherit] w-full items-center justify-center p-6">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="sm" 
              variant="outline" 
              type="button" 
              className="h-7"
              onClick={handleGithubSignIn}
              disabled={isLoading}
            >
              <Icons.gitHub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              type="button" 
              className="h-7"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
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
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
          <Button 
            variant="link" 
            size="sm" 
            className="w-full"
            onClick={onSwitchToSignIn}
          >
            Already have an account? Sign in
          </Button>
        </CardFooter>
      </Card>
      </form>
    </div>
  )
}

export { SignUpPage };
