/**
 * This file provides module mocking for problematic dependencies
 * during Playwright test runs.
 */

// List of modules to mock
const MOCKED_MODULES = [
  'lucide-react',
  '@testing-library/jest-dom',
  'jest-axe/extend-expect',
  '@uiw/react-md-editor'
];

// Create mock implementations for specific modules
const MODULE_MOCKS = {
  'lucide-react': {
    __esModule: true,
    // Mock all commonly used Lucide icons
    Loader2: () => null,
    Check: () => null,
    X: () => null,
    AlertCircle: () => null,
    CheckCircle2: () => null,
    Upload: () => null,
    ThumbsUp: () => null,
    Edit2: () => null,
    ChevronDown: () => null,
    ChevronUp: () => null,
    default: {}
  },
  '@testing-library/jest-dom': {
    __esModule: true,
    default: {}
  },
  'jest-axe/extend-expect': {
    __esModule: true,
    default: {}
  },
  '@uiw/react-md-editor': {
    __esModule: true,
    default: () => null
  }
};

// Mock require for Node.js
if (typeof require !== 'undefined') {
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  
  Module.prototype.require = function(id) {
    // Check if this is a module we want to mock
    const moduleToMock = MOCKED_MODULES.find(name => id.includes(name));
    
    if (moduleToMock) {
      return MODULE_MOCKS[moduleToMock] || { __esModule: true, default: {} };
    }
    
    // Otherwise use the original require
    return originalRequire.apply(this, arguments);
  };
}

// Export mock implementations for ESM
export const mockModules = MODULE_MOCKS;

console.log('Module mocking system initialized');
