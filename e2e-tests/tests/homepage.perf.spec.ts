import { test, expect } from '@playwright/test';
import { measurePagePerformance, checkPerformanceThresholds } from '../helpers/performance';

test.describe('Homepage Performance', () => {
  test('should load within performance budgets', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Measure performance metrics
    const metrics = await measurePagePerformance(page, 'homepage');
    
    // Define performance thresholds
    const thresholds = {
      firstContentfulPaint: 2000, // 2 seconds
      largestContentfulPaint: 2500, // 2.5 seconds
      pageLoadTime: 3000, // 3 seconds
      totalRequests: 50, // Maximum number of requests
      totalBytes: 2 * 1024 * 1024, // 2MB total transfer size
    };
    
    // Check if metrics meet thresholds
    const results = checkPerformanceThresholds(metrics, thresholds);
    
    // Log performance metrics for debugging
    console.log('Performance metrics:', metrics);
    console.log('Threshold results:', results);
    
    // Assert that all thresholds are met
    for (const [metric, passed] of Object.entries(results)) {
      expect(passed, `${metric} exceeds threshold`).toBe(true);
    }
  });
  
  test('should maintain performance with simulated slow connection', async ({ page }) => {
    // Enable network throttling for this specific test
    await page.context().route('**/*', route => {
      // Add a delay to all requests
      setTimeout(() => route.continue(), 100);
    });
    
    // Navigate to the homepage
    await page.goto('/');
    
    // Measure performance metrics
    const metrics = await measurePagePerformance(page, 'homepage-slow-network');
    
    // Define adjusted thresholds for slow connection
    const thresholds = {
      firstContentfulPaint: 4000, // 4 seconds
      largestContentfulPaint: 5000, // 5 seconds
      pageLoadTime: 6000, // 6 seconds
    };
    
    // Check if metrics meet thresholds
    const results = checkPerformanceThresholds(metrics, thresholds);
    
    // Assert that critical thresholds are met even with slow connection
    expect(results.firstContentfulPaint).toBe(true);
    expect(results.largestContentfulPaint).toBe(true);
  });
  
  test('should lazy load images below the fold', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Get all image elements
    const images = await page.$$eval('img', imgs => {
      return imgs.map(img => ({
        src: img.getAttribute('src'),
        loading: img.getAttribute('loading'),
        isInViewport: img.getBoundingClientRect().top < window.innerHeight
      }));
    });
    
    // Check that images below the fold use lazy loading
    const belowFoldImages = images.filter(img => !img.isInViewport);
    const nonLazyLoadedBelowFold = belowFoldImages.filter(img => 
      img.loading !== 'lazy' && !img.src?.includes('data:image')
    );
    
    // Log any issues for debugging
    if (nonLazyLoadedBelowFold.length > 0) {
      console.log('Images below fold without lazy loading:', nonLazyLoadedBelowFold);
    }
    
    // Assert that all images below the fold use lazy loading
    expect(nonLazyLoadedBelowFold.length).toBe(0);
  });
});
