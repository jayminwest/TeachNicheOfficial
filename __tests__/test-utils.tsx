import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toast';

// Mock matchMedia for next-themes
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
});

interface CustomRenderOptions {
  withAuth?: boolean;
  providerProps?: Parameters<typeof Providers>[0];
}

function render(
  ui: React.ReactElement,
  { ...options }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export const renderWithStripe = (
  ui: React.ReactElement,
  options = {}
) => {
  return render(ui, {
    withAuth: true,
    ...options,
  });
};

export * from '@testing-library/react';
export { render };
