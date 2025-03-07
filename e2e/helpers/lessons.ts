import { Page } from '@playwright/test';

/**
 * Lesson status types
 */
export type LessonStatus = 'draft' | 'published' | 'archived';

/**
 * Options for creating a mock lesson
 */
export interface MockLessonOptions {
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  creatorId?: string;
  status?: LessonStatus;
  thumbnailUrl?: string;
  muxPlaybackId?: string;
  videoProcessingStatus?: 'pending' | 'processing' | 'ready' | 'error';
  averageRating?: number;
  totalRatings?: number;
  categories?: string[];
  content?: string;
  contentUrl?: string;
}

/**
 * Create a mock lesson for testing
 * 
 * @param page - Playwright page object
 * @param options - Lesson configuration options
 * @returns The created mock lesson data
 */
export async function createMockLesson(page: Page, options: MockLessonOptions = {}) {
  // Set default options
  const defaults = {
    id: `lesson-${Date.now()}`,
    title: 'Test Lesson',
    description: 'This is a test lesson description for E2E testing.',
    price: 9.99,
    creatorId: 'test-creator-id',
    status: 'published' as LessonStatus,
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    muxPlaybackId: 'mock-playback-id',
    videoProcessingStatus: 'ready',
    averageRating: 4.5,
    totalRatings: 10,
    categories: ['test-category'],
  };
  
  const lessonData = { ...defaults, ...options };
  
  // Mock the lesson data in localStorage for client-side access
  await page.evaluate((data) => {
    // Store mock lesson data
    const mockLessons = JSON.parse(localStorage.getItem('mock-lessons') || '[]');
    const existingIndex = mockLessons.findIndex((l: any) => l.id === data.id);
    
    if (existingIndex >= 0) {
      mockLessons[existingIndex] = data;
    } else {
      mockLessons.push(data);
    }
    
    localStorage.setItem('mock-lessons', JSON.stringify(mockLessons));
    
    // If this is a purchased lesson, add to purchased lessons
    if (data.purchased) {
      const purchasedLessons = JSON.parse(localStorage.getItem('purchased-lessons') || '[]');
      if (!purchasedLessons.includes(data.id)) {
        purchasedLessons.push(data.id);
        localStorage.setItem('purchased-lessons', JSON.stringify(purchasedLessons));
      }
    }
  }, lessonData);
  
  return lessonData;
}

/**
 * Set up a mock lesson purchase
 * 
 * @param page - Playwright page object
 * @param lessonId - ID of the lesson to mark as purchased
 * @param userId - ID of the user who purchased the lesson
 */
export async function mockLessonPurchase(page: Page, lessonId: string, userId: string = 'test-learner-id') {
  await page.evaluate(({ lessonId, userId }) => {
    const purchasedLessons = JSON.parse(localStorage.getItem('purchased-lessons') || '[]');
    if (!purchasedLessons.includes(lessonId)) {
      purchasedLessons.push(lessonId);
      localStorage.setItem('purchased-lessons', JSON.stringify(purchasedLessons));
    }
    
    // Mock purchase record
    const purchases = JSON.parse(localStorage.getItem('mock-purchases') || '[]');
    purchases.push({
      id: `purchase-${Date.now()}`,
      lessonId,
      userId,
      amount: 9.99,
      status: 'completed',
      purchaseDate: new Date().toISOString(),
    });
    localStorage.setItem('mock-purchases', JSON.stringify(purchases));
  }, { lessonId, userId });
}

/**
 * Clear all mock lesson data
 * 
 * @param page - Playwright page object
 */
export async function clearMockLessons(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('mock-lessons');
    localStorage.removeItem('purchased-lessons');
    localStorage.removeItem('mock-purchases');
  });
}
/**
 * Creates a mock lesson in the test environment
 * 
 * @param page - Playwright page object
 * @param options - Configuration options for the mock lesson
 * @returns The created mock lesson data
 */
export async function createMockLesson(page, options = {}) {
  // Set default options
  const defaults = {
    id: `lesson-${Date.now()}`,
    title: 'Test Lesson',
    description: 'This is a test lesson created for E2E testing',
    price: 9.99,
    creatorId: 'test-creator-id',
    status: 'published',
    thumbnailUrl: 'https://via.placeholder.com/640x360',
    muxPlaybackId: 'mock-playback-id',
    videoProcessingStatus: 'ready',
    averageRating: 4.5,
    totalRatings: 10,
    content: 'Test lesson content',
    contentUrl: 'https://example.com/test-content'
  };
  
  const mockLesson = { ...defaults, ...options };
  
  // Mock the lesson data in localStorage for testing
  await page.evaluate((lesson) => {
    // Store the mock lesson in localStorage
    const existingLessons = JSON.parse(localStorage.getItem('mock-lessons') || '[]');
    existingLessons.push(lesson);
    localStorage.setItem('mock-lessons', JSON.stringify(existingLessons));
    
    // Also store a mapping of lesson IDs to creator IDs for access control testing
    const lessonCreatorMap = JSON.parse(localStorage.getItem('lesson-creator-map') || '{}');
    lessonCreatorMap[lesson.id] = lesson.creatorId;
    localStorage.setItem('lesson-creator-map', JSON.stringify(lessonCreatorMap));
  }, mockLesson);
  
  return mockLesson;
}

/**
 * Mocks the video processing status for a lesson
 * 
 * @param page - Playwright page object
 * @param lessonId - ID of the lesson to update
 * @param status - New video processing status
 */
export async function mockVideoProcessingStatus(page, lessonId, status) {
  await page.evaluate(({ id, newStatus }) => {
    const lessons = JSON.parse(localStorage.getItem('mock-lessons') || '[]');
    const updatedLessons = lessons.map(lesson => {
      if (lesson.id === id) {
        return { ...lesson, videoProcessingStatus: newStatus };
      }
      return lesson;
    });
    localStorage.setItem('mock-lessons', JSON.stringify(updatedLessons));
  }, { id: lessonId, newStatus: status });
}

/**
 * Mocks user access to a lesson
 * 
 * @param page - Playwright page object
 * @param userId - ID of the user
 * @param lessonId - ID of the lesson
 * @param hasAccess - Whether the user has access to the lesson
 */
export async function mockLessonAccess(page, userId, lessonId, hasAccess) {
  await page.evaluate(({ user, lesson, access }) => {
    const userLessons = JSON.parse(localStorage.getItem(`user-${user}-lessons`) || '[]');
    
    if (access && !userLessons.includes(lesson)) {
      userLessons.push(lesson);
    } else if (!access) {
      const index = userLessons.indexOf(lesson);
      if (index > -1) {
        userLessons.splice(index, 1);
      }
    }
    
    localStorage.setItem(`user-${user}-lessons`, JSON.stringify(userLessons));
  }, { user: userId, lesson: lessonId, access: hasAccess });
}
