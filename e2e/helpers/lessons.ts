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
