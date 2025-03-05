'use client'

import { useEffect } from 'react'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'

export default function AuthCallbackClient() {
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
        
        // Redirect to dashboard after processing
        window.location.href = '/dashboard'
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        window.location.href = '/dashboard'
      }
    }

    handleAuthCallback()
  }, [])

  return null
}
