// Server component
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { AuthClient } from './client';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Sign in</h1>
        <p className="text-muted-foreground mb-6">Sign in to access your account and lessons</p>
        
        <noscript>
          <div className="p-4 border border-yellow-300 bg-yellow-50 text-yellow-800 rounded-md mb-4">
            JavaScript is required to sign in. Please enable JavaScript in your browser settings.
          </div>
        </noscript>
        
        <Suspense fallback={
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-icon" />
          </div>
        }>
          <AuthClient />
        </Suspense>
      </div>
    </div>
  );
}
