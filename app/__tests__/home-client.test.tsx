import { render, screen, fireEvent } from '@testing-library/react'
import HomeClient, { redirectTo as originalRedirectTo } from '../home-client'
import { AuthDialog } from '@/app/components/ui/auth-dialog'

// Mock the redirectTo function
const mockRedirectTo = jest.fn();

// Mock the redirectTo function
jest.mock('../home-client', () => {
  const originalModule = jest.requireActual('../home-client');
  return {
    ...originalModule,
    redirectTo: jest.fn().mockImplementation((url) => mockRedirectTo(url)),
  };
});

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
    // Mock window.location.href assignment
    const originalLocation = window.location
    delete window.location
    window.location = {
      ...originalLocation,
      href: 'http://localhost',
      assign: jest.fn()
    } as any
    
    // Set URL with redirect parameter
    const url = new URL('http://localhost?redirect=/lessons')
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        href: url.href,
        search: url.search
      }
    })
    
    render(<HomeClient />)
    
    // Reset mock before test
    mockRedirectTo.mockReset();
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click()
    
    // Check if redirectTo was called with the correct URL
    expect(mockRedirectTo).toHaveBeenCalledWith('/lessons')
  })

  it('uses default redirect URL when no redirect parameter', () => {
    // Mock window.location.href assignment
    const originalLocation = window.location
    delete window.location
    window.location = {
      ...originalLocation,
      href: 'http://localhost',
      assign: jest.fn()
    } as any
    
    render(<HomeClient />)
    
    // Reset mock before test
    mockRedirectTo.mockReset();
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click()
    
    // Check if redirectTo was called with the correct URL
    expect(mockRedirectTo).toHaveBeenCalledWith('/profile')
  })

  it('handles both auth and redirect parameters together', () => {
    // Mock window.location.href assignment
    const originalLocation = window.location
    delete window.location
    window.location = {
      ...originalLocation,
      href: 'http://localhost',
      assign: jest.fn()
    } as any
    
    // Set URL with both parameters
    const url = new URL('http://localhost?auth=signin&redirect=/dashboard')
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        href: url.href,
        search: url.search
      }
    })
    
    render(<HomeClient />)
    
    // Auth dialog should be open
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'true')
    
    // Reset mock before test
    mockRedirectTo.mockReset();
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click()
    
    // Check if redirectTo was called with the correct URL
    expect(mockRedirectTo).toHaveBeenCalledWith('/dashboard')
  })
})
