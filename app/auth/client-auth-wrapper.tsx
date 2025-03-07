import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import Link from 'next/link';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';

interface ClientAuthWrapperProps {
  redirect?: string;
  errorParam?: string;
}

// Export the wrapped component with Suspense
export default function ClientAuthWrapper(props: ClientAuthWrapperProps) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-icon" />
        </div>
      </div>
    }>
      <ClientAuthWrapperContent {...props} />
    </Suspense>
  );
}

function ClientAuthWrapperContent(props: ClientAuthWrapperProps) {
  const { redirect, errorParam } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    // Store redirect URL in session storage
    if (redirect) {
      sessionStorage.setItem('auth-redirect', redirect);
    }
    
    // Set error from URL parameter if present
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    
    // Simulate loading to ensure client hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      
      const { success, error: signInError } = await signInWithGoogle();
      
      if (!success || signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError instanceof Error ? signInError.message : 'Failed to sign in with Google');
        return;
      }
      
      // Handle successful sign-in
      const redirectUrl = sessionStorage.getItem('auth-redirect');
      if (redirectUrl) {
        sessionStorage.removeItem('auth-redirect');
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Exception during sign in:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSigningIn(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-icon" />
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Authentication Error</h3>
          <p>There was a problem with the authentication component.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <Button 
          className="w-full" 
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
