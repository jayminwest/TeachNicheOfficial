import { redirect } from 'next/navigation';

export default function SignInPage() {
  // Static redirect at the server level
  redirect('/auth');
  
  // This won't be rendered, but is here as a fallback
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
    </div>
  );
}
