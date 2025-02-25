import { LessonRequest, ensureValidStatus } from '@/app/lib/schemas/lesson-request';

// Helper function to create mock requests for tests
export function createMockRequest(overrides: Partial<LessonRequest> = {}): LessonRequest {
  return {
    id: 'test-request-id',
    title: 'Test Request',
    description: 'This is a test request description',
    created_at: '2025-01-01T00:00:00.000Z',
    user_id: 'test-user-id',
    status: ensureValidStatus(overrides.status || 'open'),
    vote_count: 0,
    category: 'Test Category',
    tags: [],
    ...overrides
  };
}

// Helper function to create an array of mock requests
export function createMockRequests(count: number = 3): LessonRequest[] {
  return Array.from({ length: count }, (_, i) => createMockRequest({
    id: `test-request-id-${i}`,
    title: `Test Request ${i}`,
    vote_count: i
  }));
}
