import '@testing-library/jest-dom'

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
    return <img {...props} />
  },
}))
