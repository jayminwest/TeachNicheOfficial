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
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  
  // Apply options
  if (options.includedImpacts) {
    axeBuilder = axeBuilder.withOnlyImpacts(options.includedImpacts);
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
  // Get all interactive elements
  const interactiveElements = await page.$$('a, button, [role="button"], input, select, textarea, [tabindex="0"]');
  
  let issuesFound = false;
  
  // Check each element
  for (const element of interactiveElements) {
    // Check if the element is visible and not disabled
    const isVisible = await element.isVisible();
    const isDisabled = await element.evaluate(el => {
      return el.hasAttribute('disabled') || 
             el.hasAttribute('aria-disabled') === 'true' ||
             el.getAttribute('tabindex') === '-1';
    });
    
    if (isVisible && !isDisabled) {
      // Try to focus the element
      await element.focus();
      
      // Check if the element received focus
      const isFocused = await page.evaluate(() => {
        return document.activeElement === document.querySelector(':focus');
      });
      
      if (!isFocused) {
        issuesFound = true;
        console.error('Keyboard navigation issue: Element could not receive focus', 
          await element.evaluate(el => el.outerHTML));
      }
    }
  }
  
  return !issuesFound;
}
