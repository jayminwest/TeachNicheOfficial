import { renderHook, act } from '@testing-library/react'
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

// Set strict timeout for entire test suite
jest.setTimeout(5000)

describe('useLessonAccess', () => {
  const originalSessionStorage = window.sessionStorage
  const mockNow = new Date('2025-01-01').getTime()

  beforeAll(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })
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
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
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

    let result: any
    await act(async () => {
      result = renderHook(() => useLessonAccess(lessonId))
      // Wait for any pending state updates
      await Promise.resolve()
    })

    expect(result.result.current).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      loading: false,
      error: null
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
