// Use a static page with client-side only components to avoid SSR bailout
export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground">
            Sign in to access your account and lessons
          </p>
        </div>
        
        {/* Client-side only script to load auth component */}
        <div id="auth-container" className="space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        </div>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Create and render the auth client component
                  const container = document.getElementById('auth-container');
                  if (container) {
                    // Clear loading state
                    container.innerHTML = '';
                    
                    // Create a new script element to load the auth client
                    const script = document.createElement('script');
                    script.src = '/auth-client-bundle.js';
                    script.async = true;
                    script.onload = function() {
                      console.log('Auth client script loaded');
                    };
                    script.onerror = function() {
                      container.innerHTML = '<div class="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md"><h3 class="font-bold">Error Loading Authentication</h3><p>Please refresh the page to try again.</p></div>';
                    };
                    
                    // Append the script to the document
                    document.body.appendChild(script);
                  }
                } catch (err) {
                  console.error('Error initializing auth client:', err);
                }
              })();
            `
          }}
        />
      </div>
      
      <noscript>
        <div className="mt-8 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
    </div>
  );
}
