import { renderHook, act } from '@testing-library/react'
import { useLessonAccess } from '@/app/hooks/use-lesson-access'
import { mockPurchaseStatus } from '../utils/test-utils'
import { supabase } from '@/app/services/supabase'

// Mock Supabase client
jest.mock('@/app/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn()
          }))
        }))
      }))
    }))
  }
}))

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
    mockFetch.mockClear()
  })

  it('should return cached access data if within 5 minutes', async () => {
    const lessonId = 'test-lesson'
    const cachedData = mockPurchaseStatus('completed')
    
    window.sessionStorage.setItem(
      `lesson-access-${lessonId}`,
      JSON.stringify({
        ...cachedData,
        timestamp: Date.now() - 4 * 60 * 1000 // 4 minutes ago
      })
    )

    const { result } = renderHook(() => useLessonAccess(lessonId))
    
    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(result.current.purchaseStatus).toBe('completed')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should fetch new data if cache is expired', async () => {
    const lessonId = 'test-lesson'
    const cachedData = mockPurchaseStatus('completed')
    
    window.sessionStorage.setItem(
      `lesson-access-${lessonId}`,
      JSON.stringify({
        ...cachedData,
        timestamp: Date.now() - 6 * 60 * 1000 // 6 minutes ago
      })
    )

    const mockSupabaseResponse = {
      data: {
        status: 'completed',
        purchase_date: new Date().toISOString()
      },
      error: null
    }
    
    jest.spyOn(supabase, 'from').mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve(mockSupabaseResponse)
          })
        })
      })
    }))

    const { result } = renderHook(() => useLessonAccess(lessonId))
    
    // Should start loading
    expect(result.current.loading).toBe(true)

    // Wait for fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should retry failed requests up to 3 times', async () => {
    const lessonId = 'test-lesson'
    
    mockFetch
      .mockImplementationOnce(() => Promise.reject(new Error('Network error')))
      .mockImplementationOnce(() => Promise.reject(new Error('Network error')))
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPurchaseStatus('completed'))
        })
      )

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Wait for retries to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.hasAccess).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should handle timeout after 5 seconds', async () => {
    const lessonId = 'test-lesson'
    
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 1100))
    )

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Wait for timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1200))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeTruthy()
  }, 2000) // Set explicit timeout
})
