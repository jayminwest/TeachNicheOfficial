import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// Use type assertions to avoid type mismatches
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

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
  ...jest.requireActual('lucide-react'),
  AlertCircle: () => 'AlertCircle',
  CheckCircle2: () => 'CheckCircle2',
  Upload: () => 'Upload',
  Loader2: () => 'Loader2',
  BookOpen: () => 'BookOpen',
  DollarSign: () => 'DollarSign',
  Users: () => 'Users',
  Shield: () => 'Shield',
  Leaf: () => 'Leaf',
  GraduationCap: () => 'GraduationCap'
}));

// Mock @mux/mux-player-react
jest.mock('@mux/mux-player-react', () => ({
  __esModule: true,
  default: (props: any) => {
    return `<mux-player ${Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')}/>`
  },
}));

// Mock @mux/mux-uploader-react
jest.mock('@mux/mux-uploader-react', () => ({
  __esModule: true,
  MuxUploader: (props: any) => {
    return `<mux-uploader ${Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')}/>`
  },
}));

// Add sessionStorage mock
const mockStorage: { [key: string]: string } = {};
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    }
  },
  writable: true
});

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
