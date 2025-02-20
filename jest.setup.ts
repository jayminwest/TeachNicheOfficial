import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

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
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BookOpen: () => 'BookOpen',
  DollarSign: () => 'DollarSign',
  Users: () => 'Users',
  Shield: () => 'Shield',
  Leaf: () => 'Leaf',
  GraduationCap: () => 'GraduationCap'
}))

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
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return `<img ${Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')}/>`
  },
}))
