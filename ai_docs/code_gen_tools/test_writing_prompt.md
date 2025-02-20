# Test Generation Guidelines

## Test Structure
Follow this standard pattern for all component tests:

```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    it('renders without crashing')
    it('renders expected elements')
  })

  describe('interactions', () => {
    it('handles user interactions')
  })

  describe('props', () => {
    it('handles all required props')
  })
})
```

## Testing Priorities
1. Core functionality
   - Component rendering
   - User interactions
   - Props validation
   - State management

2. Query Priority (in order)
   - getByRole
   - getByLabelText
   - getByPlaceholderText
   - getByText
   - getByTestId (last resort)

## Best Practices
- Use Testing Library queries in preferred order
- Write user-centric tests that mirror actual usage
- Test component behavior, not implementation
- Use userEvent over fireEvent
- Mock external dependencies consistently
- Reset mocks between tests

## Standard Utilities
- Use `render()` from test-utils.tsx
- Use `createMockProps()` for consistent prop mocking
- Use `userEvent.setup()` for interactions

## Test Organization
- Place test files in __tests__ directory
- Name test files with .test.tsx suffix
- Mirror the source file structure
- One test file per component

## Component Analysis Instructions
For each component:
1. Identify props and interfaces
2. List key UI elements and their roles
3. Document user interactions
4. Note external dependencies
5. Determine required mocks

## Test Generation Steps
1. Create basic rendering test
2. Add element presence tests
3. Add interaction tests
4. Verify props handling
5. Add edge cases
6. Verify test isolation
