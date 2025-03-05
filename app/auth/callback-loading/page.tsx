'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClientSupabaseClient()
        
        // Try to get the session from the URL
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error processing auth callback:', error)
        } else {
          console.log('Auth callback successful, user:', data.session?.user?.id)
        }
        
        // Redirect to dashboard regardless of success/failure
        // The auth state will be handled by the AuthContext
        router.push('/dashboard')
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        router.push('/dashboard')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
      <p className="text-lg">Completing sign in...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}
