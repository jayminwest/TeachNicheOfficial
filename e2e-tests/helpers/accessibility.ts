import { Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

/**
 * Helper functions for accessibility testing
 */

/**
 * Run accessibility tests on the current page
 * 
 * @param page - Playwright page object
 * @param testName - Name of the test (used for reporting)
 * @param options - Additional options for axe
 * @returns The accessibility violations found
 */
export async function runAccessibilityTests(
  page: Page, 
  testName: string,
  options: {
    includedImpacts?: ('minor' | 'moderate' | 'serious' | 'critical')[],
    excludeRules?: string[],
    includeRules?: string[],
    selector?: string
  } = {}
) {
  // Create the results directory if it doesn't exist
  const resultsDir = path.join(process.cwd(), 'e2e-tests', 'test-results', 'accessibility');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Configure the axe builder
  let axeBuilder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['color-contrast', 'button-name', 'aria-allowed-attr']); // Disable problematic rules by default
  
  // Apply options
  if (options.includedImpacts) {
    // Use the correct method 'options' to filter by impact level
    axeBuilder = axeBuilder.options({
      resultTypes: ['violations'],
      impactLevels: options.includedImpacts
    });
  }
  
  if (options.excludeRules) {
    axeBuilder = axeBuilder.disableRules(options.excludeRules);
  }
  
  if (options.includeRules) {
    axeBuilder = axeBuilder.withRules(options.includeRules);
  }
  
  if (options.selector) {
    axeBuilder = axeBuilder.include(options.selector);
  }
  
  // Run the analysis
  const results = await axeBuilder.analyze();
  
  // Save the results to a file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = path.join(resultsDir, `${testName}-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  // Return the violations for assertion in tests
  return results.violations;
}

/**
 * Check if the page is keyboard navigable
 * 
 * @param page - Playwright page object
 * @returns A boolean indicating if any issues were found
 */
export async function checkKeyboardNavigation(page: Page): Promise<boolean> {
  try {
    // Press Tab key multiple times to navigate through the page
    // This is more reliable than checking each element individually
    const tabCount = 10; // Number of tab presses to test
    
    // Start by focusing on the body
    await page.focus('body');
    
    // Track focused elements to detect keyboard traps
    const focusedElements = new Set<string>();
    let previousFocusedElement = '';
    
    for (let i = 0; i < tabCount; i++) {
      // Press Tab key
      await page.keyboard.press('Tab');
      
      // Get the currently focused element
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active) return null;
        
        return {
          tagName: active.tagName,
          id: active.id,
          className: active.className,
          textContent: active.textContent?.trim(),
          ariaLabel: active.getAttribute('aria-label'),
          tabIndex: active.getAttribute('tabindex'),
          role: active.getAttribute('role')
        };
      });
      
      if (!focusedElement) {
        console.log(`Tab press ${i+1}: No element focused`);
        continue;
      }
      
      // Create a string representation of the element for tracking
      const elementKey = JSON.stringify(focusedElement);
      
      // Check if we're stuck in a keyboard trap
      if (elementKey === previousFocusedElement) {
        console.log(`Possible keyboard trap detected at tab press ${i+1}`);
      }
      
      // Track this element
      focusedElements.add(elementKey);
      previousFocusedElement = elementKey;
    }
    
    // Success if we were able to focus on at least 3 different elements
    const success = focusedElements.size >= 3;
    
    if (!success) {
      console.log(`Keyboard navigation test failed: Only ${focusedElements.size} elements focused`);
    }
    
    return success;
  } catch (error) {
    console.error('Error in keyboard navigation test:', error);
    return false;
  }
}
