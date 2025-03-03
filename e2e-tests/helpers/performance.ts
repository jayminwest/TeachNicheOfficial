import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Helper functions for performance testing
 */

export interface PerformanceMetrics {
  // Navigation timing metrics
  navigationStart: number;
  loadEventEnd: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  
  // Custom metrics
  totalRequests: number;
  totalBytes: number;
  jsRequests: number;
  cssRequests: number;
  imageRequests: number;
  fontRequests: number;
  otherRequests: number;
  
  // Calculated metrics
  pageLoadTime: number;
  domContentLoadedTime: number;
  timeToFirstByte?: number;
}

/**
 * Measure performance metrics for the current page
 * 
 * @param page - Playwright page object
 * @param testName - Name of the test (used for reporting)
 * @returns The collected performance metrics
 */
export async function measurePagePerformance(page: Page, testName: string): Promise<PerformanceMetrics> {
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    // Get First Paint and First Contentful Paint
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    // Get Largest Contentful Paint if available
    let largestContentfulPaint = 0;
    
    // Check if there are already LCP entries
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries && lcpEntries.length > 0) {
      largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
    } else {
      // If no LCP entries, use FCP as a fallback
      largestContentfulPaint = firstContentfulPaint;
    }
    
    // Get resource timing entries
    const resourceEntries = performance.getEntriesByType('resource');
    
    // Count requests by type
    const jsRequests = resourceEntries.filter(entry => entry.initiatorType === 'script').length;
    const cssRequests = resourceEntries.filter(entry => entry.initiatorType === 'css' || entry.initiatorType === 'link').length;
    const imageRequests = resourceEntries.filter(entry => entry.initiatorType === 'img').length;
    const fontRequests = resourceEntries.filter(entry => {
      const url = entry.name.toLowerCase();
      return url.endsWith('.woff') || url.endsWith('.woff2') || url.endsWith('.ttf') || url.endsWith('.otf');
    }).length;
    const otherRequests = resourceEntries.length - (jsRequests + cssRequests + imageRequests + fontRequests);
    
    // Calculate total bytes transferred
    const totalBytes = resourceEntries.reduce((total, entry) => {
      // Use transferSize if available, otherwise use encodedBodySize
      return total + (entry.transferSize || entry.encodedBodySize || 0);
    }, 0);
    
    return {
      navigationStart: perfEntries.startTime,
      loadEventEnd: perfEntries.loadEventEnd,
      domContentLoaded: perfEntries.domContentLoadedEventEnd,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint,
      
      totalRequests: resourceEntries.length,
      totalBytes,
      jsRequests,
      cssRequests,
      imageRequests,
      fontRequests,
      otherRequests,
      
      pageLoadTime: perfEntries.loadEventEnd - perfEntries.startTime,
      domContentLoadedTime: perfEntries.domContentLoadedEventEnd - perfEntries.startTime,
      timeToFirstByte: perfEntries.responseStart - perfEntries.requestStart,
    };
  });
  
  // Create the results directory if it doesn't exist
  const resultsDir = path.join(process.cwd(), 'e2e-tests', 'test-results', 'performance');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Save the metrics to a file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = path.join(resultsDir, `${testName}-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(metrics, null, 2));
  
  return metrics;
}

/**
 * Check if performance metrics meet the specified thresholds
 * 
 * @param metrics - The collected performance metrics
 * @param thresholds - The performance thresholds to check against
 * @returns An object containing the results of each threshold check
 */
export function checkPerformanceThresholds(
  metrics: PerformanceMetrics, 
  thresholds: Partial<Record<keyof PerformanceMetrics, number>>
): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  
  for (const [key, threshold] of Object.entries(thresholds)) {
    const metricKey = key as keyof PerformanceMetrics;
    const metricValue = metrics[metricKey];
    
    if (metricValue !== undefined) {
      results[key] = metricValue <= threshold;
    }
  }
  
  return results;
}
