import { renderHook } from '@testing-library/react'
import { useLessonAccess } from '@/app/hooks/use-lesson-access'
import { mockPurchaseStatus } from '../utils/test-utils'
import { supabase } from '@/app/services/supabase'

// Mock modules
jest.mock('@/app/services/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' }
  })
}))

describe('useLessonAccess', () => {
  const originalSessionStorage = window.sessionStorage
  const mockNow = new Date('2025-01-01').getTime()

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockNow)
  })

  beforeEach(() => {
    window.sessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
      removeItem: jest.fn(),
      length: 0,
      key: jest.fn()
    }
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  afterAll(() => {
    window.sessionStorage = originalSessionStorage
  })

  it('uses cached data when valid', async () => {
    const lessonId = 'test-lesson'
    const cachedData = {
      ...mockPurchaseStatus('completed'),
      timestamp: mockNow - 1000 // 1 second ago
    }

    window.sessionStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(cachedData))

    const { result } = renderHook(() => useLessonAccess(lessonId))

    expect(result.current).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      loading: false,
      error: null
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('fetches fresh data when cache expired', async () => {
    const lessonId = 'test-lesson'
    const mockData = {
      status: 'completed',
      purchase_date: mockNow.toString()
    }

    jest.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockData, error: null })
          })
        })
      })
    } as any))

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Initial loading state
    expect(result.current.loading).toBe(true)

    // Wait for next tick to process promises
    await Promise.resolve()

    expect(result.current).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      purchaseDate: mockData.purchase_date,
      loading: false,
      error: null
    })
  })

  it('handles errors gracefully', async () => {
    const lessonId = 'test-lesson'
    const mockError = new Error('Database error')

    jest.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.reject(mockError)
          })
        })
      })
    } as any))

    const { result } = renderHook(() => useLessonAccess(lessonId))

    await Promise.resolve()

    expect(result.current).toEqual({
      hasAccess: false,
      purchaseStatus: 'none',
      loading: false,
      error: mockError
    })
  })

  it('handles timeouts', async () => {
    const lessonId = 'test-lesson'
    
    // Mock a slow response
    jest.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => new Promise(() => {}) // Never resolves
          })
        })
      })
    } as any))

    const { result } = renderHook(() => useLessonAccess(lessonId))

    // Advance to the 5 second timeout
    await jest.advanceTimersByTimeAsync(5000)

    expect(result.current).toEqual({
      hasAccess: false,
      purchaseStatus: 'none',
      loading: false,
      error: new Error('Access check timed out')
    })
  })
})
