import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { Providers } from '@/components/providers';
import { AuthContext } from '@/auth/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com'
  },
  loading: false
};

interface CustomRenderOptions {
  withAuth?: boolean;
  withStripe?: boolean;
  providerProps?: Parameters<typeof Providers>[0];
}

function render(
  ui: React.ReactElement,
  { withAuth = false, withStripe = false, providerProps, ...options }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let wrapped = (
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

    if (withAuth) {
      wrapped = (
        <AuthContext.Provider value={mockAuthContext}>
          {wrapped}
        </AuthContext.Provider>
      );
    }

    return wrapped;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export const renderWithStripe = (
  ui: React.ReactElement,
  options = {}
) => {
  return render(ui, {
    withAuth: true,
    withStripe: true,
    ...options,
  });
};

export * from '@testing-library/react';
export { render };
