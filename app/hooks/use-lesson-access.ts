'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/services/auth/AuthContext'
import { purchasesService } from '@/app/services/database/purchasesService'
import type { LessonAccess, PurchaseStatus } from '@/app/services/database/purchasesService'

interface AccessCacheEntry {
  hasAccess: boolean
  purchaseStatus: PurchaseStatus
  purchaseDate?: string
  timestamp: number
}

export function useLessonAccess(lessonId: string): LessonAccess & { 
  loading: boolean
  error: Error | null 
} {
  const { user, loading: authLoading } = useAuth()
  const [access, setAccess] = useState<LessonAccess>({ 
    hasAccess: false,
    purchaseStatus: 'none'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    // Check for success URL parameter
    const isSuccess = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).get('purchase') === 'success';
    
    // If payment was just successful, set access to true immediately
    // and clear any cached access data to force a refresh
    if (isSuccess) {
      console.log('Purchase success detected in URL, granting immediate access');
      
      // Clear the cache to force a refresh
      if (user?.id && lessonId) {
        const cacheKey = `lesson-access-${lessonId}-${user.id}`;
        sessionStorage.removeItem(cacheKey);
        
        // Also try to update the purchase status directly
        try {
          console.log('Refreshing lesson access after successful purchase');
          purchasesService.checkLessonAccess(user.id, lessonId);
        } catch (err) {
          console.warn('Failed to refresh access status:', err);
        }
      }
      
      setAccess({
        hasAccess: true,
        purchaseStatus: 'completed'
      });
      setLoading(false);
      
      // Remove the success parameter from the URL to prevent issues on refresh
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('purchase');
        window.history.replaceState({}, '', url.toString());
      }
      
      return;
    }
    
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    const TIMEOUT_MS = 5000 // 5 seconds
    const RETRY_ATTEMPTS = 3
    let attempts = 0
    let retryTimeoutId: NodeJS.Timeout
    let mounted = true
    
    async function checkAccess(): Promise<void> {
      // Don't check access if auth is still loading or no lessonId
      if (authLoading || !lessonId) {
        return
      }
      
      // If not logged in, no access
      if (!user) {
        if (mounted) {
          setAccess({ hasAccess: false, purchaseStatus: 'none' })
          setLoading(false)
        }
        return
      }

      // Check cache first
      const cacheKey = `lesson-access-${lessonId}-${user.id}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try {
          const entry: AccessCacheEntry = JSON.parse(cached)
          if (Date.now() - entry.timestamp < CACHE_DURATION) {
            if (mounted) {
              setAccess({
                hasAccess: entry.hasAccess,
                purchaseStatus: entry.purchaseStatus,
                purchaseDate: entry.purchaseDate
              })
              setLoading(false)
            }
            return
          }
        } catch (e) {
          // If cache parsing fails, just continue with the request
          console.warn('Failed to parse lesson access cache:', e)
        }
      }

      try {
        // Set a timeout for the request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
        
        // Use the purchasesService to check access
        const { data, error: serviceError } = await Promise.race([
          purchasesService.checkLessonAccess(user.id, lessonId),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Access check timed out')), TIMEOUT_MS)
          })
        ])
        
        clearTimeout(timeoutId)
        
        if (!mounted) return
        
        if (serviceError) {
          throw serviceError || new Error('Failed to check lesson access')
        }
        
        // Cache the result
        const accessData: LessonAccess = data || {
          hasAccess: false,
          purchaseStatus: 'none'
        }
        
        const cacheEntry: AccessCacheEntry = {
          ...accessData,
          timestamp: Date.now()
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry))
        
        setAccess(accessData)
        setError(null)
      } catch (err) {
        if (!mounted) return

        console.error('Error checking lesson access:', err)
        setError(err instanceof Error ? err : new Error('Failed to check access'))
        
        // Only retry on non-timeout errors
        if (attempts < RETRY_ATTEMPTS && err instanceof Error && !err.message.includes('timeout')) {
          attempts++
          retryTimeoutId = setTimeout(checkAccess, 1000 * attempts)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAccess()

    return () => {
      mounted = false
      clearTimeout(retryTimeoutId)
    }
  }, [lessonId, user, authLoading])

  return { ...access, loading, error }
}
