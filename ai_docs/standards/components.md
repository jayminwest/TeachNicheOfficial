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
