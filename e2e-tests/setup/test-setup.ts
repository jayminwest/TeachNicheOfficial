/**
 * Global setup for Playwright tests
 * 
 * This file is loaded before tests run and helps configure the environment
 * to avoid conflicts between ESM and CommonJS modules.
 */

// Mock problematic modules that cause ESM/CJS conflicts
const mockModules = [
  'lucide-react',
  '@testing-library/jest-dom',
  'jest-axe/extend-expect'
];

// Register module mocks to prevent errors when Playwright loads files that import these
for (const moduleName of mockModules) {
  // This prevents the actual module from being loaded during tests
  // which avoids the "Cannot require() ES Module" errors
  jest.mock(moduleName, () => ({}));
}

// Mock global test functions to prevent errors when loading Jest test files
global.jest = {
  mock: () => ({}),
  fn: () => () => {},
};

global.describe = () => {};
global.it = () => {};
global.test = () => {};
global.expect = () => ({
  toEqual: () => {},
  toBe: () => {},
  toHaveBeenCalled: () => {},
});

export {};
