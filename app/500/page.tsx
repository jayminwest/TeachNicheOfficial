export default function Custom500() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">500 - Server Error</h1>
      <p className="mb-8">Sorry, something went wrong on our server.</p>
      <a 
        href="/" 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Return to Home
      </a>
    </div>
  );
}
