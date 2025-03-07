# Test Coverage Improvement Plan

## Issue Description

Our current test coverage is at 17.24% overall, which is significantly below our target of 80% minimum coverage. This creates several risks:

1. Undetected bugs in production
2. Difficulty refactoring code with confidence
3. Regression issues when adding new features
4. Lack of documentation through tests

We need a structured approach to systematically improve our test coverage, starting with the simplest components and gradually moving to more complex functionality.

## IMPORTANT: Guidelines for Implementing Tests

**CRITICAL REQUIREMENT**: When working on any file in this plan, you MUST:

1. Request BOTH the implementation file AND its corresponding test file before making any changes
2. Never modify a file without seeing both the implementation and test files
3. Ensure you understand the component's purpose and behavior before writing tests
4. Follow the established testing patterns in the project

Example request: "I'll work on testing the Badge component. Please add both `app/components/ui/badge.tsx` and `app/components/ui/__tests__/badge.test.tsx` to the chat so I can see both files before making changes."

## Technical Analysis

The coverage report shows several patterns:
- UI components have inconsistent coverage (some at 0%, others at 100%)
- API routes are largely untested (most at 0%)
- Core services like database and authentication have partial coverage
- Many client components have no tests at all

The most efficient approach is to start with "low-hanging fruit" - simple components and utilities that can be tested with minimal setup, then progressively tackle more complex areas.

## Phased Approach

### Phase 1: Simple UI Components (Target: +15% overall coverage)
Focus on stateless UI components that require minimal mocking:
- Components in `app/components/ui/` with simple props
- Utility functions in `app/utils/`
- Simple hooks that don't require complex state management

### Phase 2: Page Components and Forms (Target: +15% overall coverage)
- Page components with minimal data requirements
- Form components with validation logic
- Client components with simple state management

### Phase 3: API Routes and Services (Target: +20% overall coverage)
- API routes with clear input/output patterns
- Service classes with mockable dependencies
- Database interaction layers

### Phase 4: Complex Integrations (Target: +15% overall coverage)
- Authentication flows
- Payment processing
- Video upload and processing
- Multi-step user journeys

## Implementation Plan

### Phase 1: Simple UI Components

#### UI Components
- [x] `app/components/ui/badge.tsx` (improved to 100%)
- [ ] `app/components/ui/accordion.tsx` (currently 0%)
- [ ] `app/components/ui/alert.tsx` (currently 0%)
- [ ] `app/components/ui/checkbox.tsx` (currently 0%)
- [ ] `app/components/ui/dropdown-menu.tsx` (currently 0%)
- [ ] `app/components/ui/features.tsx` (currently 0%)
- [ ] `app/components/ui/footer.tsx` (currently 0%)
- [ ] `app/components/ui/index.ts` (currently 0%)
- [ ] `app/components/ui/progress.tsx` (currently 0%)
- [ ] `app/components/ui/switch.tsx` (currently 0%)
- [ ] `app/components/ui/tabs.tsx` (currently 0%)
- [ ] `app/components/ui/toast.tsx` (currently 0%)
- [ ] `app/components/ui/theme-toggle.tsx` (currently 0%)

#### Utility Functions
- [ ] `app/utils/format.ts` (currently 40%)
- [ ] `app/utils/purchase-helpers.ts` (currently 0%)
- [ ] `app/lib/auth-config.ts` (currently 0%)
- [ ] `app/lib/auth-helpers.ts` (currently 0%)

### Phase 2: Page Components and Forms

#### Page Components
- [ ] `app/home-client.tsx` (currently 0%)
- [ ] `app/error.tsx` (currently 0%)
- [ ] `app/error-page.tsx` (currently 0%)
- [ ] `app/global-error.tsx` (currently 0%)
- [ ] `app/not-found.tsx` (currently 0%)
- [ ] `app/page.tsx` (currently 0%)
- [ ] `app/about/client.tsx` (currently 0%)
- [ ] `app/legal/legal-content.tsx` (currently 0%)
- [ ] `app/legal/content-wrapper.tsx` (currently 0%)

#### Form Components
- [ ] `app/components/ui/lesson-form.tsx` (currently 0%)
- [ ] `app/profile/components/profile-form.tsx` (currently 76.19%)
- [ ] `app/components/ui/sign-in.tsx` (improve from 91.11%)
- [ ] `app/components/ui/email-signup.tsx` (currently 0%)
- [ ] `app/components/ui/image-uploader.tsx` (currently 0%)

### Phase 3: API Routes and Services

#### API Routes
- [ ] `app/api/lessons/route.ts` (improve from 73.68%)
- [ ] `app/api/lessons/[id]/route.ts` (currently 0%)
- [ ] `app/api/lessons/check-purchase/route.ts` (currently 0%)
- [ ] `app/api/lessons/purchase/route.ts` (currently 0%)
- [ ] `app/api/lessons/update-purchase/route.ts` (currently 0%)
- [ ] `app/api/checkout/route.ts` (improve from 20.83%)
- [ ] `app/api/profile/route.ts` (currently 0%)
- [ ] `app/api/profile/get/route.ts` (currently 0%)
- [ ] `app/api/profile/update/route.ts` (currently 0%)
- [ ] `app/api/categories/route.ts` (currently 0%)
- [ ] `app/api/votes/route.ts` (improve from 39.58%)

#### Service Classes
- [ ] `app/services/database/LessonsService.ts` (currently 0%)
- [ ] `app/services/profile/ProfileService.ts` (currently 2.5%)
- [ ] `app/services/database/PurchasesService.ts` (improve from 80.53%)
- [ ] `app/services/database/DatabaseService.ts` (improve from 80%)
- [ ] `app/services/stripe.ts` (improve from 23.57%)
- [ ] `app/services/mux.ts` (currently 0%)
- [ ] `app/services/supabase.ts` (currently 0%)

### Phase 4: Complex Integrations

#### Authentication
- [ ] `app/auth/auth-client.tsx` (currently 0%)
- [ ] `app/auth/client.tsx` (currently 0%)
- [ ] `app/auth/cookies.ts` (currently 0%)
- [ ] `app/auth/client-auth-wrapper.tsx` (improve from 93.02%)
- [ ] `app/services/auth/supabaseAuth.ts` (improve from 85.36%)
- [ ] `app/services/auth/AuthContext.tsx` (improve from 86.66%)

#### Media Handling
- [ ] `app/components/ui/video-player.tsx` (currently 0%)
- [ ] `app/components/ui/video-uploader.tsx` (currently 0%)
- [ ] `app/hooks/use-image-upload.ts` (currently 0%)
- [ ] `app/hooks/use-video-upload.ts` (currently 0%)
- [ ] `app/api/mux/asset-by-upload/route.ts` (currently 0%)
- [ ] `app/api/mux/asset-from-upload/route.ts` (currently 0%)
- [ ] `app/api/mux/asset-status/route.ts` (currently 0%)
- [ ] `app/api/mux/playback-id/route.ts` (currently 0%)
- [ ] `app/api/mux/sign-playback/route.ts` (currently 0%)
- [ ] `app/api/mux/upload/route.ts` (currently 0%)
- [ ] `app/api/upload/image/route.ts` (currently 0%)

#### Payment Flows
- [ ] `app/components/ui/lesson-checkout.tsx` (currently 0%)
- [ ] `app/components/ui/price-breakdown.tsx` (currently 0%)
- [ ] `app/api/stripe/connect/route.ts` (currently 0%)
- [ ] `app/api/stripe/connect/callback/route.ts` (currently 0%)
- [ ] `app/api/stripe/connect/status/route.ts` (currently 0%)
- [ ] `app/api/webhooks/stripe/route.ts` (currently 0%)

#### Complex Components
- [ ] `app/components/ui/lesson-access-gate.tsx` (currently 0%)
- [ ] `app/components/ui/lesson-card.tsx` (currently 0%)
- [ ] `app/components/ui/lesson-grid.tsx` (currently 0%)
- [ ] `app/components/ui/lesson-preview-dialog.tsx` (currently 0%)
- [ ] `app/components/ui/header.tsx` (currently 0%)
- [ ] `app/hooks/use-lesson-access.ts` (currently 0%)
- [ ] `app/hooks/use-lessons.ts` (currently 0%)
- [ ] `app/hooks/use-profile.ts` (currently 0%)
- [ ] `app/hooks/use-purchase-lesson.ts` (improve from 90.47%)
- [ ] `app/hooks/useCategories.ts` (improve from 15%)

## Progress Tracking

We'll track progress using the following metrics:

| Phase | Starting Coverage | Target Coverage | Actual Coverage | Status |
|-------|------------------|----------------|-----------------|--------|
| Phase 1 | 17.24% | 32% | - | Not Started |
| Phase 2 | 32% | 47% | - | Not Started |
| Phase 3 | 47% | 67% | - | Not Started |
| Phase 4 | 67% | 82% | - | Not Started |

## Testing Standards

All new tests should follow these standards:

1. **Isolation**: Tests should not depend on each other
2. **Mocking**: External dependencies should be properly mocked
3. **Coverage**: Tests should aim for branch coverage, not just line coverage
4. **Readability**: Tests should be clear about what they're testing
5. **Maintenance**: Tests should be easy to maintain and update

## Example Test Implementation

Here's an example of how to test a simple UI component:

```tsx
// Example test for badge.tsx
import { render, screen } from '@testing-library/react';
import { Badge } from '@/app/components/ui/badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary');
  });

  it('renders with custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('custom-class');
  });
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Next.js Applications](https://nextjs.org/docs/testing)
- Our internal [standards/testing.md](../standards/testing.md) document

## Environment Details

- Next.js Version: 15.1.7
- React Version: 19.0.0
- Testing Framework: Jest 29.7.0
- Testing Library: 16.2.0

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-07 | Documentation Team | Initial version |
