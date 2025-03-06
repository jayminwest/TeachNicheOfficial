import AuthClientWrapper from './auth-client';

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
