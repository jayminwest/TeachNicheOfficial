'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';

interface AuthClientProps {
  errorMessage?: string | null;
}

export default function AuthClient({ errorMessage }: AuthClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set error message after component mounts to avoid hydration issues
  useEffect(() => {
    setError(errorMessage || null);
  }, [errorMessage]);
  
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('Sign in error:', error);
        setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
      }
    } catch (err) {
      console.error('Exception during sign in:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Sign in to access your account and lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
