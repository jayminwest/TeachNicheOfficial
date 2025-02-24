import { renderHook } from '@testing-library/react'
import { useLessonAccess } from '@/app/hooks/use-lesson-access'
import { mockPurchaseStatus } from '../utils/test-utils'
import { createMockSupabaseClient } from '../../../__mocks__/services/supabase'
import { supabase } from '@/app/services/supabase'

// Mock Supabase client
jest.mock('@/app/services/supabase', () => {
  const { createMockSupabaseClient } = require('../../../__mocks__/services/supabase')
  return {
    supabase: createMockSupabaseClient()
  }
})

// Mock AuthContext
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' }
  })
}))

describe('useLessonAccess', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    window.sessionStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns cached access data if within 5 minutes', () => {
    const lessonId = 'test-lesson'
    const cachedData = mockPurchaseStatus('completed')
    
    window.sessionStorage.setItem(
      `lesson-access-${lessonId}-test-user`,
      JSON.stringify({
        ...cachedData,
        timestamp: Date.now() - 4 * 60 * 1000
      })
    )

    const { result } = renderHook(() => useLessonAccess(lessonId))
    
    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(result.current.purchaseStatus).toBe('completed')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('fetches new data if cache is expired', () => {
    const lessonId = 'test-lesson'
    const cachedData = mockPurchaseStatus('completed')
    
    window.sessionStorage.setItem(
      `lesson-access-${lessonId}-test-user`,
      JSON.stringify({
        ...cachedData,
        timestamp: Date.now() - 6 * 60 * 1000
      })
    )

    const mockClient = createMockSupabaseClient({
      shouldSucceed: true,
      data: {
        status: 'completed',
        purchase_date: new Date().toISOString()
      }
    })
    
    jest.mocked(supabase).from.mockImplementation(mockClient.from)

    const { result } = renderHook(() => useLessonAccess(lessonId))
    
    expect(result.current.loading).toBe(true)
    
    // Fast-forward timers
    jest.runAllTimers()

    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(supabase.from).toHaveBeenCalledWith('purchases')
  })

  it('retries failed requests up to 3 times', () => {
    const lessonId = 'test-lesson'
    
    const mockClient = createMockSupabaseClient({
      shouldSucceed: false,
      errorMessage: 'Network error'
    })
    
    jest.mocked(supabase).from.mockImplementation(mockClient.from)

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Fast-forward past all retries
    jest.advanceTimersByTime(1000) // First retry
    jest.advanceTimersByTime(2000) // Second retry
    jest.advanceTimersByTime(3000) // Third retry

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeTruthy()
    expect(supabase.from).toHaveBeenCalledTimes(3)
  })

  it('handles timeout after 5 seconds', () => {
    const lessonId = 'test-lesson'
    
    const mockClient = createMockSupabaseClient({
      shouldSucceed: true,
      delay: 6000 // Longer than timeout
    })
    
    jest.mocked(supabase).from.mockImplementation(mockClient.from)

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Fast-forward past timeout
    jest.advanceTimersByTime(5100)

    expect(result.current.loading).toBe(false)
    expect(result.current.error?.message).toBe('Access check timed out')
  })
})
