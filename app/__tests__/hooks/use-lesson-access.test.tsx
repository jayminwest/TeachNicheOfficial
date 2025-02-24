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
})
