import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { Providers } from '@/components/providers';
import { AuthContext } from '@/auth/AuthContext';
import { loadStripe } from '@stripe/stripe-js';


interface CustomRenderOptions {
  withAuth?: boolean;
  providerProps?: Parameters<typeof Providers>[0];
}

function render(
  ui: React.ReactElement,
  { providerProps, ...options }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <Providers
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        {...providerProps}
      >
        {children}
      </Providers>
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
