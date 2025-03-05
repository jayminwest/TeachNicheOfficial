import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function Custom404Page() {
  // Simple redirect to the not-found page
  // This avoids any client-side hooks that might cause issues
  return redirect('/not-found')
}
