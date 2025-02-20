import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// Common mock props generator
export function createMockProps<T>(component: React.ComponentType<T>): T {
  // Extract prop types from component
  const propTypes = Object.keys((component as any).propTypes || {})
  
  // Generate mock data for each prop
  return propTypes.reduce((props, key) => ({
    ...props,
    [key]: `mock-${key}`,
  }), {} as T)
}

// Enhanced render function with common providers and utilities
function render(ui: React.ReactElement, options = {}) {
  const result = rtlRender(ui, {
    wrapper: ({ children }) => children,
    ...options,
  })

  return {
    ...result,
    // Add accessibility testing
    async checkA11y() {
      const results = await axe(result.container)
      expect(results).toHaveNoViolations()
    },
    // Add user event setup
    user: userEvent.setup(),
  }
}

export * from '@testing-library/react'
export { render, userEvent }
