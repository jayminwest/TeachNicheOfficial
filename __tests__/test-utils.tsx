import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { Providers } from '@/components/providers'

function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <Providers
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </Providers>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export { render }
