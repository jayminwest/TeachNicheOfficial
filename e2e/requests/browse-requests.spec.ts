import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { setupApiInterceptors } from '../helpers/api-interceptor';
import { createMockRequest } from '../helpers/requests';

test.describe('Browse Lesson Requests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
    
    // Create some mock requests with different properties
    await createMockRequest(page, {
      id: 'request-1',
      title: 'Beginner Kendama Tutorial',
      category: 'Beginner Tricks',
      voteCount: 15,
      status: 'open'
    });
    
    await createMockRequest(page, {
      id: 'request-2',
      title: 'Advanced Kendama Techniques',
      category: 'Advanced Tricks',
      voteCount: 8,
      status: 'open'
    });
    
    await createMockRequest(page, {
      id: 'request-3',
      title: 'Kendama Maintenance Guide',
      category: 'Equipment',
      voteCount: 12,
      status: 'in_progress'
    });
  });
  
  test('displays request cards with correct information', async ({ page }) => {
    // Go to requests page
    await page.goto('/requests');
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /lesson requests/i })).toBeVisible();
    
    // Verify request cards are displayed
    await expect(page.getByText('Beginner Kendama Tutorial')).toBeVisible();
    await expect(page.getByText('Advanced Kendama Techniques')).toBeVisible();
    await expect(page.getByText('Kendama Maintenance Guide')).toBeVisible();
    
    // Verify vote counts are displayed
    await expect(page.getByText('15')).toBeVisible();
    await expect(page.getByText('8')).toBeVisible();
    await expect(page.getByText('12')).toBeVisible();
  });
  
  test('filters requests by category', async ({ page }) => {
    // Go to requests page
    await page.goto('/requests');
    
    // Select category filter
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('button', { name: /beginner tricks/i }).click();
    
    // Verify only matching requests are shown
    await expect(page.getByText('Beginner Kendama Tutorial')).toBeVisible();
    await expect(page.getByText('Advanced Kendama Techniques')).not.toBeVisible();
    await expect(page.getByText('Kendama Maintenance Guide')).not.toBeVisible();
  });
  
  test('sorts requests by popularity', async ({ page }) => {
    // Go to requests page
    await page.goto('/requests');
    
    // Select sort by popularity
    await page.getByRole('button', { name: /sort/i }).click();
    await page.getByRole('button', { name: /popular/i }).click();
    
    // Check order of elements (most votes first)
    const requestTitles = await page.locator('[data-testid="request-card"] h3').allTextContents();
    expect(requestTitles[0]).toContain('Beginner Kendama Tutorial');
    expect(requestTitles[1]).toContain('Kendama Maintenance Guide');
    expect(requestTitles[2]).toContain('Advanced Kendama Techniques');
  });
  
  test('sorts requests by newest', async ({ page }) => {
    // Create a new request with a more recent timestamp
    await createMockRequest(page, {
      id: 'request-4',
      title: 'New Request',
      category: 'General',
      voteCount: 0,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    
    // Go to requests page
    await page.goto('/requests');
    
    // Select sort by newest
    await page.getByRole('button', { name: /sort/i }).click();
    await page.getByRole('button', { name: /newest/i }).click();
    
    // Check order of elements (newest first)
    const requestTitles = await page.locator('[data-testid="request-card"] h3').allTextContents();
    expect(requestTitles[0]).toContain('New Request');
  });
  
  test('filters requests by status', async ({ page }) => {
    // Go to requests page
    await page.goto('/requests');
    
    // Select status filter
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('button', { name: /in progress/i }).click();
    
    // Verify only in-progress requests are shown
    await expect(page.getByText('Kendama Maintenance Guide')).toBeVisible();
    await expect(page.getByText('Beginner Kendama Tutorial')).not.toBeVisible();
    await expect(page.getByText('Advanced Kendama Techniques')).not.toBeVisible();
  });
  
  test('shows request details when clicking on a request', async ({ page }) => {
    // Go to requests page
    await page.goto('/requests');
    
    // Click on a request
    await page.getByText('Beginner Kendama Tutorial').click();
    
    // Verify request details are shown
    await expect(page.getByRole('heading', { name: 'Beginner Kendama Tutorial' })).toBeVisible();
    await expect(page.getByText('Category: Beginner Tricks')).toBeVisible();
    await expect(page.getByText('15')).toBeVisible(); // Vote count
  });
});
