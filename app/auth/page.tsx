// Static page with no client components to avoid useSearchParams() error
export const dynamic = 'force-static';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground">
            Sign in to access your account and lessons
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded-md mb-4"></div>
            <p className="text-center text-sm text-muted-foreground">Loading sign in options...</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
        
        <noscript>
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
          </div>
        </noscript>
        
        <script dangerouslySetInnerHTML={{ 
          __html: `
            // Load the actual auth client after page loads
            document.addEventListener('DOMContentLoaded', function() {
              const script = document.createElement('script');
              script.src = '/auth-client.js';
              script.async = true;
              document.body.appendChild(script);
            });
          `
        }} />
      </div>
    </div>
  );
}
