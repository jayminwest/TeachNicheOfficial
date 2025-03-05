import { useAuth } from '@/app/services/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/app/components/ui/use-toast'

interface UseAuthGuardOptions {
  redirectTo?: string
  showToast?: boolean
  toastMessage?: string
  onUnauthenticated?: () => void
}

/**
 * A hook to guard routes or actions that require authentication
 * 
 * @param options Configuration options
 * @returns Object containing authentication state and utility functions
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { 
    redirectTo = '/sign-in',
    showToast = true,
    toastMessage = 'Please sign in to continue',
    onUnauthenticated
  } = options
  
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [hasChecked, setHasChecked] = useState(false)
  
  useEffect(() => {
    // Only run the check after the auth state has loaded
    if (!loading) {
      if (!isAuthenticated) {
        if (showToast) {
          toast({
            title: 'Authentication Required',
            description: toastMessage,
            variant: 'destructive',
          })
        }
        
        if (redirectTo) {
          router.push(redirectTo)
        }
        
        if (onUnauthenticated) {
          onUnauthenticated()
        }
      }
      
      setHasChecked(true)
    }
  }, [isAuthenticated, loading, redirectTo, router, showToast, toastMessage, onUnauthenticated])
  
  /**
   * Guard a function that requires authentication
   * @param fn The function to guard
   * @returns A new function that only executes if authenticated
   */
  const guardFn = <T extends (...args: unknown[]) => unknown>(fn: T): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      if (!isAuthenticated) {
        if (showToast) {
          toast({
            title: 'Authentication Required',
            description: toastMessage,
            variant: 'destructive',
          })
        }
        
        if (redirectTo) {
          router.push(redirectTo)
        }
        
        if (onUnauthenticated) {
          onUnauthenticated()
        }
        
        return undefined
      }
      
      return fn(...args)
    }
  }
  
  return {
    isAuthenticated,
    loading,
    hasChecked,
    user,
    guardFn
  }
}
