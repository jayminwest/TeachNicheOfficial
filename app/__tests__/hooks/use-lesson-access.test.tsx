import { renderHook, act } from '@testing-library/react'
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
    // Clear session storage before each test
    window.sessionStorage.clear()
    jest.clearAllMocks()
  })

  it('should return cached access data if within 5 minutes', async () => {
    const lessonId = 'test-lesson'
    const cachedData = mockPurchaseStatus('completed')
    
    window.sessionStorage.setItem(
      `lesson-access-${lessonId}-test-user`,
      JSON.stringify({
        ...cachedData,
        timestamp: Date.now() - 4 * 60 * 1000 // 4 minutes ago
      })
    )

    const { result } = renderHook(() => useLessonAccess(lessonId))
    
    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(result.current.purchaseStatus).toBe('completed')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('should fetch new data if cache is expired', async () => {
    const lessonId = 'test-lesson'
    const cachedData = mockPurchaseStatus('completed')
    
    window.sessionStorage.setItem(
      `lesson-access-${lessonId}-test-user`,
      JSON.stringify({
        ...cachedData,
        timestamp: Date.now() - 6 * 60 * 1000 // 6 minutes ago
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
    
    // Should start loading
    expect(result.current.loading).toBe(true)

    // Wait for fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(supabase.from).toHaveBeenCalledWith('purchases')
  })

  it('should retry failed requests up to 3 times', async () => {
    const lessonId = 'test-lesson'
    
    const mockClient = createMockSupabaseClient({
      shouldSucceed: false,
      errorMessage: 'Network error',
      delay: 100
    })
    
    jest.mocked(supabase).from.mockImplementation(mockClient.from)

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Wait for retries to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeTruthy()
    expect(supabase.from).toHaveBeenCalledTimes(3)
  })

  it('should handle timeout after 5 seconds', async () => {
    const lessonId = 'test-lesson'
    
    const mockClient = createMockSupabaseClient({
      shouldSucceed: true,
      delay: 6000 // Longer than timeout
    })
    
    jest.mocked(supabase).from.mockImplementation(mockClient.from)

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Wait for timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5500))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error?.message).toBe('Access check timed out')
  }, 7000) // Set explicit timeout longer than test duration
})
