import { render, screen, waitFor } from '@testing-library/react'
import HomeClient from '../home-client'
import { AuthDialog } from '@/app/components/ui/auth-dialog'

// Mock the AuthDialog component
jest.mock('@/app/components/ui/auth-dialog', () => ({
  AuthDialog: jest.fn(({ open, onOpenChange, onSuccess }) => (
    <div data-testid="auth-dialog" data-open={open}>
      <button data-testid="close-button" onClick={() => onOpenChange(false)}>Close</button>
      <button data-testid="success-button" onClick={onSuccess}>Success</button>
    </div>
  ))
}))

describe('HomeClient', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Reset URL
    delete window.location
    window.location = new URL('http://localhost') as any
  })

  it('renders without crashing', () => {
    render(<HomeClient />)
    expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'false')
  })

  it('opens auth dialog when auth=signin in URL', () => {
    // Set URL with auth=signin
    window.location = new URL('http://localhost?auth=signin') as any
    
    render(<HomeClient />)
    
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'true')
  })

  it('sets redirect URL when redirect parameter is present', () => {
    // Mock location.href setter
    const hrefSetter = jest.fn()
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
    })
    
    // Set URL with redirect parameter
    window.location = new URL('http://localhost?redirect=/lessons') as any
    
    render(<HomeClient />)
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click()
    
    // Check if location.href was set to the redirect URL
    expect(hrefSetter).toHaveBeenCalledWith('/lessons')
  })

  it('uses default redirect URL when no redirect parameter', () => {
    // Mock location.href setter
    const hrefSetter = jest.fn()
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
    })
    
    // Set URL without redirect parameter
    window.location = new URL('http://localhost') as any
    
    render(<HomeClient />)
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click()
    
    // Check if location.href was set to the default redirect URL
    expect(hrefSetter).toHaveBeenCalledWith('/profile')
  })

  it('handles both auth and redirect parameters together', () => {
    // Mock location.href setter
    const hrefSetter = jest.fn()
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
    })
    
    // Set URL with both parameters
    window.location = new URL('http://localhost?auth=signin&redirect=/dashboard') as any
    
    render(<HomeClient />)
    
    // Auth dialog should be open
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'true')
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click()
    
    // Check if location.href was set to the specified redirect URL
    expect(hrefSetter).toHaveBeenCalledWith('/dashboard')
  })
})
