import React from 'react'
import { render as testingLibraryRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'

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

export { userEvent }
