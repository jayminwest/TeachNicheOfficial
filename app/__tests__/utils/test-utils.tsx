import React from 'react'
import { render as testingLibraryRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/app/services/auth/AuthContext'
import 'jest-axe/extend-expect'

// Mock matchMedia if it's not available (jest environment)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

export function render(ui: React.ReactElement, options = {}) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )

  return {
    ...testingLibraryRender(ui, { wrapper, ...options }),
  }
}

// Mock file creation helper
export function createMockFile(name = 'test.mp4', type = 'video/mp4') {
  return new File(['mock file content'], name, { type });
}

// Auth wrapper for testing components that need auth context
export function renderWithAuth(ui: React.ReactElement, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { user: _user = null, ...options } = {}) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );

  return {
    ...testingLibraryRender(ui, { wrapper, ...options }),
  };
}

// Mux testing helpers
export const muxTestHelpers = {
  mockUploadSuccess: () => {
    return {
      id: 'mock-upload-id',
      url: 'https://mock-upload-url.com',
      status: 'asset_created',
    };
  },
  mockUploadError: () => {
    return new Error('Upload failed');
  },
  mockPlaybackId: 'mock-playback-id',
  mockAssetId: 'mock-asset-id',
};

// Purchase status mock helper
export function mockPurchaseStatus(status: 'pending' | 'completed' | 'failed' | 'refunded' | 'none') {
  return {
    hasAccess: status === 'completed',
    purchaseStatus: status,
    purchaseDate: status === 'completed' ? new Date().toISOString() : undefined,
  };
}

export { userEvent }
