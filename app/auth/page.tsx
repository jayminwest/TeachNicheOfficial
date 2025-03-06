import ClientWrapper from './client-wrapper';

export default function AuthPage() {
  return (
    <div className="min-h-screen pt-16">
      <ClientWrapper />
      
      <noscript>
        <div className="container max-w-md mx-auto py-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
