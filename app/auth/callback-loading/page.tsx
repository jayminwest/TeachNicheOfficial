export const dynamic = 'force-static'

// Static page that will be replaced by client-side JS
export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
        <p className="text-lg">Completing sign in...</p>
        <noscript>
          <p className="mt-4">JavaScript is required for authentication. Please enable JavaScript or <a href="/dashboard" className="text-primary hover:underline">go to dashboard</a>.</p>
        </noscript>
      </div>
    </div>
  )
}
