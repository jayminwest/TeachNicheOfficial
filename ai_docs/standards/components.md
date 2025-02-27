# Component Development Standards

## Component Organization

### Project Structure
```
app/
├── components/
│   ├── ui/           # Shared UI components using shadcn/ui
│   └── __tests__/    # Component tests
├── features/         # Feature-specific components
│   └── __tests__/    # Feature-specific tests
└── [feature]/        # Route-based components
    └── __tests__/    # Route-specific tests
```

### Component Types
- UI Components: Reusable shadcn/ui based components
- Feature Components: Business logic components
- Page Components: Next.js page components
- Layout Components: Page layout and structure

## Development Guidelines

### 1. Component Creation
- Start with Shadcn UI components when possible
- Create custom components only when necessary
- Follow TypeScript strict mode
- Use proper prop typing

### 2. Props Interface
```typescript
interface ExampleComponentProps {
  // Required props first
  required: string;
  
  // Optional props after
  optional?: string;
  
  // Callback props with proper typing
  onChange?: (value: string) => void;
  
  // Children prop if needed
  children?: React.ReactNode;
}
```

### 3. Component Structure
```typescript
export function Component({ 
  required,
  optional,
  onChange,
  children 
}: ComponentProps) {
  // State/hooks at top
  const [state, setState] = useState();
  
  // Effects after state
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleChange = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### 4. Styling
- Use Tailwind CSS classes
- Follow design system tokens
- Avoid inline styles
- Use CSS modules for complex styles

### 5. Testing
- Write tests during development
- Test all component states
- Test user interactions
- Verify accessibility

### 6. Documentation
- Add JSDoc comments
- Include usage examples
- Document props interface
- Note any dependencies

### 7. Performance
- Memoize when needed
- Optimize re-renders
- Lazy load if large
- Monitor bundle size

### 8. Accessibility
- Use semantic HTML
- Include ARIA attributes
- Support keyboard navigation
- Test with screen readers

## Quality Checklist

- [ ] TypeScript strict mode compliance
- [ ] Props properly typed
- [ ] Tests written and passing
- [ ] Documentation complete
- [ ] Accessibility verified
- [ ] Performance optimized
- [ ] Design system consistent
- [ ] Code review completed
# Component Development Standards

This document outlines the standards for developing components in the Teach Niche platform, with an emphasis on our Test Driven Development (TDD) approach.

## Test Driven Development (TDD)

### Core Requirement

All components must be developed using Test Driven Development:

1. Write tests before implementing the component
2. Run the tests to verify they fail (Red)
3. Implement the minimum code to make tests pass (Green)
4. Refactor while maintaining passing tests (Refactor)
5. Repeat for additional functionality

### Component Test Requirements

Every component must have the following tests before implementation:

1. **Rendering Tests**: Verify the component renders correctly
2. **Prop Tests**: Verify the component handles different props correctly
3. **Interaction Tests**: Verify user interactions work as expected
4. **Edge Cases**: Test boundary conditions and error states
5. **Accessibility Tests**: Verify accessibility requirements are met

## Component Structure

### Functional Components

- Use functional components with hooks
- Avoid class components
- Use TypeScript for type safety

```tsx
// Example component structure
import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'rounded-md font-medium transition-colors',
          // Variant styles
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          variant === 'link' && 'text-primary underline-offset-4 hover:underline',
          // Size styles
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 px-3',
          size === 'lg' && 'h-11 px-8',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
```

### Component File Organization

- One component per file
- Place in appropriate directory based on component type
- Include index.ts files for clean exports
- Co-locate tests with components

```
components/
  ui/
    button/
      Button.tsx
      __tests__/
        Button.test.tsx
      index.ts
```

## Testing Components

### Test File Structure

```tsx
// Example test file structure
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  // Test rendering
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  // Test props
  it('applies variant classes correctly', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button', { name: /outline button/i })
    expect(button).toHaveClass('border-input')
    expect(button).not.toHaveClass('bg-primary')
  })

  // Test interactions
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // Test accessibility
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Testing Third-Party Integrations

For components that interact with third-party APIs:

1. Start with mocked responses for basic functionality
2. Add tests that use actual API calls to verify correct integration
3. Test error handling and edge cases

```tsx
// Example of testing a component with Stripe integration
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaymentForm } from '../PaymentForm'
import { setupStripeTestMode } from '@/lib/test-utils/stripe'

// Mock tests
describe('PaymentForm with mocks', () => {
  beforeEach(() => {
    jest.mock('@stripe/react-stripe-js', () => ({
      useStripe: () => ({
        createPaymentMethod: jest.fn().mockResolvedValue({
          paymentMethod: { id: 'pm_test_123' }
        })
      }),
      useElements: () => ({
        getElement: jest.fn()
      })
    }))
  })

  it('submits payment form successfully', async () => {
    const onSuccess = jest.fn()
    render(<PaymentForm amount={1000} onSuccess={onSuccess} />)
    
    fireEvent.click(screen.getByRole('button', { name: /pay/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('pm_test_123')
    })
  })
})

// Actual API tests (in a separate file or conditional execution)
describe('PaymentForm with actual Stripe', () => {
  beforeAll(() => {
    setupStripeTestMode()
  })

  it('processes actual test payment', async () => {
    const onSuccess = jest.fn()
    render(<PaymentForm amount={1000} onSuccess={onSuccess} />)
    
    // Fill in actual test card details
    const cardInput = screen.getByLabelText(/card number/i)
    fireEvent.change(cardInput, { target: { value: '4242424242424242' } })
    
    // Fill other required fields...
    
    fireEvent.click(screen.getByRole('button', { name: /pay/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      // Verify the payment was actually processed in Stripe
    })
  })
})
```

## Component Design Principles

### Atomic Design

Follow atomic design principles:
- **Atoms**: Basic building blocks (buttons, inputs)
- **Molecules**: Groups of atoms (form fields, cards)
- **Organisms**: Complex UI sections (headers, forms)
- **Templates**: Page layouts
- **Pages**: Specific instances of templates

### Composition Over Inheritance

- Build complex components by composing simpler ones
- Use the children prop for flexible content
- Use render props or hooks for shared behavior

### Props API Design

- Use descriptive prop names
- Provide sensible defaults
- Use TypeScript interfaces for prop types
- Document props with JSDoc comments

```tsx
/**
 * Card component for displaying content in a contained box
 * @param className - Additional CSS classes
 * @param children - Card content
 * @param variant - Visual style variant
 * @param hoverable - Whether the card should have hover effects
 */
interface CardProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'filled'
  hoverable?: boolean
}
```

## Styling Standards

### CSS Approach

- Use Tailwind CSS for styling
- Use the `cn` utility for conditional classes
- Follow the project color scheme and design tokens
- Ensure responsive design for all components

### Accessibility

- Include proper ARIA attributes
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Support screen readers
- Test with accessibility tools

## Performance Considerations

- Memoize expensive calculations with useMemo
- Optimize re-renders with React.memo and useCallback
- Lazy load components when appropriate
- Use virtualization for long lists

## Documentation

- Include JSDoc comments for all components and props
- Provide usage examples
- Document any non-obvious behaviors
- Include accessibility notes

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | UI Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD and third-party API testing |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
