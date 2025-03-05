export const dynamic = 'force-static';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="animate-pulse">
        <h1 className="text-4xl font-bold mb-4">Sign In</h1>
        <p className="mb-8">Redirecting to authentication page...</p>
      </div>
      
      <noscript>
        <div className="mt-8 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
      
      <script dangerouslySetInnerHTML={{ 
        __html: `
          // Redirect to auth page
          window.location.href = '/auth';
        `
      }} />
    </div>
  );
}
