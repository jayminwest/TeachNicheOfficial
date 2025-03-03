import { test, expect } from '@playwright/test';
import { runAccessibilityTests, checkKeyboardNavigation } from '../helpers/accessibility';

test.describe('Homepage Accessibility', () => {
  test('should have no critical or serious accessibility violations', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Run accessibility tests
    const violations = await runAccessibilityTests(page, 'homepage', {
      includedImpacts: ['critical', 'serious']
    });
    
    // Log any violations for debugging
    if (violations.length > 0) {
      console.log('Accessibility violations found:', 
        violations.map(v => `${v.id} (${v.impact}): ${v.help}`));
    }
    
    // Assert no critical or serious violations
    expect(violations.length).toBe(0);
  });
  
  test('should be navigable using keyboard', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check keyboard navigation
    const isKeyboardNavigable = await checkKeyboardNavigation(page);
    
    // Assert the page is keyboard navigable
    expect(isKeyboardNavigable).toBe(true);
  });
  
  test('should have proper heading structure', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check heading structure
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => {
      return elements.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.trim()
      }));
    });
    
    // Verify there's exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // Verify heading levels don't skip (e.g., h1 to h3 without h2)
    let previousLevel = 1;
    let hasError = false;
    
    for (const heading of headings) {
      if (heading.level > previousLevel + 1) {
        console.error(`Heading structure error: h${previousLevel} followed by h${heading.level}`);
        hasError = true;
      }
      previousLevel = heading.level;
    }
    
    expect(hasError).toBe(false);
  });
});
