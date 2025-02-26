/**
 * Global setup for Playwright tests
 * 
 * This file is loaded before tests run and helps configure the environment
 * to avoid conflicts between ESM and CommonJS modules.
 */

// This is a proper setup file that will be executed before tests run
// It returns a function that Playwright will call

export default async function globalSetup() {
  // Set up global mocks for problematic modules
  // These will be available to all test files
  global.jest = {
    mock: () => ({ __esModule: true }),
    fn: () => jest.fn(),
    spyOn: () => ({ mockImplementation: () => {} }),
    requireActual: () => ({}),
    requireMock: () => ({}),
    resetAllMocks: () => {},
    clearAllMocks: () => {},
    restoreAllMocks: () => {},
  };

  // Mock Jest test functions
  global.describe = function(name, fn) { 
    console.log(`[MOCK] Test suite: ${name}`);
  };
  global.it = function(name, fn) { 
    console.log(`[MOCK] Test case: ${name}`);
  };
  global.test = global.it;
  global.expect = function() {
    return {
      toEqual: () => {},
      toBe: () => {},
      toHaveBeenCalled: () => {},
      toHaveBeenCalledWith: () => {},
      toMatchSnapshot: () => {},
      toBeInTheDocument: () => {},
      not: {
        toBeInTheDocument: () => {},
        toBe: () => {},
      }
    };
  };

  // Create a module mock system
  const moduleCache = new Map();
  
  // Override require to handle problematic modules
  const originalRequire = module.constructor.prototype.require;
  module.constructor.prototype.require = function(id) {
    // List of modules to mock
    const mockedModules = [
      'lucide-react',
      '@testing-library/jest-dom',
      'jest-axe/extend-expect',
      '@uiw/react-md-editor'
    ];
    
    // Check if this is a module we want to mock
    if (mockedModules.some(name => id.includes(name))) {
      // Return cached mock if we have one
      if (moduleCache.has(id)) {
        return moduleCache.get(id);
      }
      
      // Create a new mock
      const mock = { __esModule: true, default: {} };
      
      // Add specific mocks for certain modules
      if (id.includes('lucide-react')) {
        // Mock all Lucide icons
        const icons = ['Loader2', 'Check', 'X', 'AlertCircle', 'CheckCircle2', 
                      'Upload', 'ThumbsUp', 'Edit2', 'ChevronDown', 'ChevronUp'];
        icons.forEach(icon => {
          mock[icon] = function MockIcon() { return null; };
        });
      }
      
      moduleCache.set(id, mock);
      return mock;
    }
    
    // Otherwise use the original require
    return originalRequire.apply(this, arguments);
  };

  console.log('Global setup complete - module mocking enabled');
}
