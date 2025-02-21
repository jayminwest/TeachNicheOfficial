'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/services/auth/AuthContext'
import { supabase } from '@/app/services/supabase'
import type { LessonAccess, PurchaseStatus } from '@/types/purchase'

interface AccessCacheEntry {
  hasAccess: boolean
  purchaseStatus: PurchaseStatus | 'none'
  purchaseDate?: string
  timestamp: number
}

export function useLessonAccess(lessonId: string): LessonAccess & { 
  loading: boolean
  error: Error | null 
} {
  const { user } = useAuth()
  const [access, setAccess] = useState<LessonAccess>({ 
    hasAccess: false,
    purchaseStatus: 'none'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  
  useEffect(() => {
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    const TIMEOUT_MS = 5000 // 5 seconds
    const RETRY_ATTEMPTS = 3
    let attempts = 0
    let timeoutId: NodeJS.Timeout
    let mounted = true

    async function checkAccess() {
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
      }

      try {
        timeoutId = setTimeout(() => {
          if (mounted) {
            setError(new Error('Access check timed out'))
            setLoading(false)
          }
        }, TIMEOUT_MS)

        const { data: purchase, error: dbError } = await supabase
          .from('purchases')
          .select('status, purchase_date')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single()

        clearTimeout(timeoutId)

        if (dbError) throw dbError

        const accessData: LessonAccess = {
          hasAccess: purchase?.status === 'completed',
          purchaseStatus: purchase?.status || 'none',
          purchaseDate: purchase?.purchase_date
        }

        // Cache the result
        const cacheEntry: AccessCacheEntry = {
          ...accessData,
          timestamp: Date.now()
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry))

        if (mounted) {
          setAccess(accessData)
          setError(null)
        }
      } catch (err) {
        console.error('Error checking lesson access:', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to check access'))
          
          // Retry logic for recoverable errors
          if (attempts < RETRY_ATTEMPTS && err instanceof Error && !err.message.includes('timeout')) {
            attempts++
            setTimeout(checkAccess, 1000 * attempts)
          }
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
      clearTimeout(timeoutId)
    }
  }, [lessonId, user])

  return { ...access, loading, error }
}
