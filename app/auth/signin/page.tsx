export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Sign In</h1>
      <p className="mb-8">Please sign in to continue.</p>
      <a 
        href="/auth" 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Go to Sign In
      </a>
    </div>
  );
}
