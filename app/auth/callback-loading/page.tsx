import { redirect } from 'next/navigation'

// Server component that redirects to dashboard
export default function AuthCallbackPage() {
  // Use server-side redirect instead of client-side
  return redirect('/dashboard')
}
