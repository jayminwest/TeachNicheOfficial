# Standardized Test Writing Prompt

Please write unit tests for the following component/function according to our testing standards:

## Test Organization
- Place test in __tests__ directory next to source file (e.g., component/Button.tsx → component/__tests__/Button.test.tsx)
- Use .test.tsx/.test.ts suffix
- One test file per source file
- Mirror the source file structure

## Component Analysis
1. Identify:
   - Props and interfaces
   - Key UI elements and their roles
   - User interactions
   - External dependencies
   - Required mocks

## Required Test Structure
describe('[ComponentName]', () => {
  // Standard setup
  beforeEach(() => {
    // Reset mocks
  })

  describe('rendering', () => {
    it('renders without crashing')
    it('renders expected elements')
    it('matches accessibility requirements')
  })
  
  describe('interactions', () => {
    it('handles user interactions')
    it('manages state correctly')
  })
  
  describe('props', () => {
    it('handles all required props')
    it('handles optional props')
    it('handles edge cases')
  })
})

## Testing Requirements
- Use test-utils.tsx for rendering with providers
  - render() for basic components
  - { withAuth: true } for authenticated components
- Use setup/test-helpers.tsx for common patterns
  - setup() for userEvent
  - findByTextWithMarkup() for complex text
  - waitForLoadingToFinish() for async
- Use setup/mocks.ts for consistent mock data
  - createMockUser()
  - mockSupabaseClient

## Query Priority (Use in this order)
1. getByRole (preferred)
2. getByLabelText
3. getByPlaceholderText
4. getByText
5. getByTestId (last resort)

## Best Practices
- Write user-centric tests that mirror actual usage
- Test behavior, not implementation
- Use userEvent over fireEvent
- Mock external dependencies consistently
- Reset mocks between tests
- Include accessibility checks
- Aim for 80% minimum coverage
- 100% coverage for critical paths

Here are the files to test:


Please generate comprehensive tests following these guidelines.
