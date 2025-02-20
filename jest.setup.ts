import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Suppress specific console messages during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if the error is a Stripe signature verification error
  if (typeof args[0] === 'string' && (
    args[0].includes('Warning: ReactDOM.render is no longer supported') ||
    args[0].includes('No signatures found matching the expected signature for payload')
  )) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

// Mock console.log during tests
console.log = jest.fn();

// Only mock window-specific items if window is defined (browser environment)
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BookOpen: () => 'BookOpen',
  DollarSign: () => 'DollarSign',
  Users: () => 'Users',
  Shield: () => 'Shield',
  Leaf: () => 'Leaf',
  GraduationCap: () => 'GraduationCap'
}));

// Mock next/font
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
    subsets: ['latin'],
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
    subsets: ['latin'],
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return `<img ${Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')}/>`
  },
}));
