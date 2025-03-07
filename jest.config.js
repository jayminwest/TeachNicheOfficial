const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: ['next/babel']
    }]
  },
  transformIgnorePatterns: [
    // Expand the list of packages that need to be transformed
    'node_modules/(?!(lucide-react|@lucide|jose|@supabase|@auth|@radix-ui|@mux|next/dist/client|next/dist/shared)/)'
  ],
  // Updated to include API tests and different test types
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/__tests__/**/*.integration.test.ts?(x)',
    '**/__tests__/**/*.e2e.test.ts?(x)',
    '**/api/**/__tests__/**/*.test.ts?(x)'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Added specific coverage requirements for API routes based on documentation
    "app/api/**/*.{js,jsx,ts,tsx}": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Critical paths require 100% coverage
    "app/api/checkout/**/*.{js,jsx,ts,tsx}": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    "app/api/stripe/**/*.{js,jsx,ts,tsx}": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    "app/api/webhooks/**/*.{js,jsx,ts,tsx}": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  // Added watchPathIgnorePatterns to improve watch mode performance
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  // Added testTimeout for API tests that might take longer
  testTimeout: 10000,
  // Ensure moduleDirectories includes node_modules for proper resolution
  moduleDirectories: ['node_modules', '<rootDir>']
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
