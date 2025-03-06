import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client component with no SSR
const AuthClientWrapper = dynamic(() => import('./auth-client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground">
            Sign in to access your account and lessons
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </div>
  )
});

export default function AuthPage() {
  return (
    <>
      <AuthClientWrapper />
      
      <noscript>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
          <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
              JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
            </div>
          </div>
        </div>
      </noscript>
    </>
  );
}
