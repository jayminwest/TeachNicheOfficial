# AI Documentation Collection

This file contains a collection of all documentation from the ai_docs directory.

## Table of Contents

- Core Documentation
- Developer Guidelines
- External Resources
- How To Use
- Issue Reports
- Launch Plan
- Branch Guides
- Checks
- Standards
- Workflows
-e \n## File: ai_docs/misc/ARC_PROMPT_REQUESTS_PAGE.md\n
Implement this plan:

# Lesson Requests Feature Implementation Plan

## HIGH LEVEL OBJECTIVES
1. Create public lesson request browsing system
2. Implement dual-mode request creation (anonymous/authenticated)
3. Establish request management interface
4. Set up notification/communication system
5. Implement voting/ranking system for requests
6. Create directory view with sorting options

## MID LEVEL OBJECTIVES
1. Public Browsing System
   - Public requests listing page
   - Search/filter functionality
   - Request detail views
   
2. Request Creation
   - Anonymous request form
   - Enhanced authenticated user form
   - Form validation system
   
3. Database Structure
   - Lesson requests table
   - User relationships
   - Anonymous request handling

4. Voting System
   - Vote up/down functionality
   - Vote tracking per user
   - Vote-based sorting
   
5. Directory View
   - Grid/List view toggle
   - Sort by (newest, most voted, trending)
   - Category/tag filtering

## FILE STRUCTURE

### Files Needed Before Implementation
- app/layout.tsx (existing)
- components/ui/button.tsx (existing)
- components/ui/card.tsx (existing)
- components/ui/form.tsx (existing)
- components/ui/input.tsx (existing)
- components/ui/textarea.tsx (existing)
- components/providers.tsx (existing)
- lib/supabase.ts (existing)
- lib/utils.ts (existing)
- auth/AuthContext.tsx (existing)

### Files To Be Created/Modified

/app
  /requests
    /page.tsx             # Main requests directory page
    /[id]/page.tsx        # Individual request view
    /new/page.tsx         # Create new request page
    /loading.tsx          # Loading state
    /error.tsx            # Error state

/components/requests
  /RequestCard.tsx        # Card component for request in grid view
  /RequestList.tsx        # List view component
  /RequestForm.tsx        # Form for creating/editing requests
  /RequestVoteButton.tsx  # Vote interaction component
  /RequestFilters.tsx     # Filter and sort controls
  /RequestGrid.tsx        # Grid view component
  /RequestStats.tsx       # Shows votes and other metrics

/lib
  /requests
    /types.ts            # Request-related type definitions
    /api.ts              # Request API utilities
    /validation.ts       # Request form validation schemas

/hooks
  /useRequests.ts        # Hook for fetching requests
  /useVoting.ts          # Hook for vote interactions
  /useRequestFilters.ts  # Hook for managing filters/sorting

/api/requests
  /route.ts              # Main requests API endpoint
  /[id]/route.ts         # Individual request endpoint
  /vote/route.ts         # Voting endpoint

/__tests__
  /components/requests   # Test files for request components
  /api/requests         # Test files for request API endpoints


## Database Schema

### Lesson Requests Table
```sql
create table lesson_requests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users,
  status text default 'open' check (status in ('open', 'in_progress', 'completed')),
  vote_count integer default 0,
  category text,
  tags text[]
);

-- Enable RLS
alter table lesson_requests enable row level security;

-- Policies
create policy "Requests are viewable by everyone"
  on lesson_requests for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create requests"
  on lesson_requests for insert
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own requests"
  on lesson_requests for update
  to authenticated
  using (auth.uid() = user_id);
```

### Request Votes Table
```sql
create table request_votes (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references lesson_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  vote_type text check (vote_type in ('up', 'down')),
  created_at timestamp with time zone default now(),
  unique(request_id, user_id)
);

-- Indexes
create index idx_request_votes_request_id on request_votes(request_id);
create index idx_request_votes_user_id on request_votes(user_id);
create index idx_lessons_vote_count on lesson_requests(vote_count desc);
```

## KEY FEATURES OF DIRECTORY PAGE
1. Authentication gate for voting (but not for viewing)
2. Real-time vote updates
3. Sorting options:
   - Most voted (all time)
   - Trending (recent votes)
   - Newest
   - Category/tags
4. Toggle between:
   - Grid view (card-based)
   - List view (more detailed)

## IMPLEMENTATION STEPS

## SECURITY & PERFORMANCE

### Supabase RLS Policies
```sql
-- Allow anyone to read requests
create policy "Requests are viewable by everyone"
on lesson_requests for select
to anon, authenticated
using (true);

-- Only authenticated users can create requests
create policy "Authenticated users can create requests"
on lesson_requests for insert
to authenticated
using (true);

-- Only vote table access for authenticated users
create policy "Only authenticated users can vote"
on request_votes for all
to authenticated
using (true);
```

### Rate Limiting
Location: `src/middleware.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/utils/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/requests')) {
    try {
      await limiter.check(request, 10) // 10 requests per minute
      return NextResponse.next()
    } catch {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }
}
```

### Pagination
Location: `src/hooks/useRequests.ts`
```typescript
const ITEMS_PER_PAGE = 12;

export const useRequests = (page: number = 1) => {
  const { data, error, isLoading } = useSWR(
    `/api/requests?page=${page}&limit=${ITEMS_PER_PAGE}`,
    fetcher
  );
  
  return {
    requests: data?.requests ?? [],
    totalPages: Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE),
    isLoading,
    error
  };
};
```

## TESTING STRATEGY

### Unit Tests
Location: `src/components/requests/__tests__/RequestCard.test.tsx`
```typescript
import { render, screen } from '@testing-library/react'
import RequestCard from '../RequestCard'

describe('RequestCard', () => {
  it('renders request title and description', () => {
    const request = {
      title: 'Test Request',
      description: 'Test Description',
      vote_count: 0
    }
    
    render(<RequestCard request={request} />)
    
    expect(screen.getByText('Test Request')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })
})
```

Location: `src/hooks/__tests__/useVoting.test.ts`
```typescript
import { renderHook, act } from '@testing-library/react'
import { useVoting } from '../useVoting'

describe('useVoting', () => {
  it('handles upvote action', async () => {
    const { result } = renderHook(() => useVoting())
    
    await act(async () => {
      await result.current.handleVote('test-id', 'up')
    })
    
    expect(result.current.isLoading).toBe(false)
  })
})
```

### E2E Test
Location: `e2e/requests.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test('user can view and create requests', async ({ page }) => {
  await page.goto('/requests')
  await expect(page.getByTestId('requests-grid')).toBeVisible()
  
  await page.goto('/requests/create')
  await page.fill('[name="title"]', 'Test Lesson Request')
  await page.fill('[name="description"]', 'Test Description')
  await page.click('button[type="submit"]')
  
  await expect(page.getByText('Request submitted successfully')).toBeVisible()
})
```

## DEPENDENCIES TO INSTALL
```bash
npm install @testing-library/react @testing-library/jest-dom @playwright/test zod swr
```

-e \n## File: ai_docs/misc/REFUND_PLAN.md\n
# Refund Implementation Plan

## Type Definitions

```typescript
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RefundRequest {
  id: string;
  purchase_id: string;
  user_id: string;
  creator_id: string;
  amount: number; // In cents
  reason: string;
  status: RefundStatus;
  stripe_refund_id?: string;
  created_at: string;
  updated_at: string;
}
```

## Database Schema

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  user_id UUID REFERENCES auth.users(id),
  creator_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status RefundStatus NOT NULL DEFAULT 'pending',
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Add RLS policies
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refunds"
  ON refunds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can view refunds for their lessons"
  ON refunds FOR SELECT
  USING (auth.uid() = creator_id);
```

## Business Rules

```typescript
// lib/constants.ts
export const REFUND_RULES = {
  WINDOW_DAYS: 30, // Refund window in days
  MIN_WATCH_PERCENT: 25, // Maximum watched percentage allowed for refund
  AUTOMATIC_APPROVAL_WINDOW_HOURS: 24, // Auto-approve if within first 24h
  MAX_REFUNDS_PER_USER_MONTH: 3 // Limit refunds per user
} as const;
```

## Implementation Components

### 1. Refund Handler API Route

```typescript
// app/api/purchases/[id]/refund/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get purchase details
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, lessons(*)')
    .eq('id', params.id)
    .single();

  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  // Check refund eligibility
  const isEligible = await checkRefundEligibility(purchase, session.data.session.user);
  if (!isEligible.allowed) {
    return NextResponse.json({ error: isEligible.reason }, { status: 400 });
  }

  try {
    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: purchase.payment_intent_id,
      reason: 'requested_by_customer'
    });

    // Record refund in database
    const { data: refundRecord, error } = await supabase
      .from('refunds')
      .insert({
        purchase_id: purchase.id,
        user_id: session.data.session.user.id,
        creator_id: purchase.creator_id,
        amount: purchase.amount,
        reason: request.body.reason,
        stripe_refund_id: refund.id,
        status: 'processing'
      })
      .select()
      .single();

    if (error) throw error;

    // Update purchase status
    await supabase
      .from('purchases')
      .update({ status: 'refunded' })
      .eq('id', purchase.id);

    return NextResponse.json({ refund: refundRecord });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
```

### 2. Eligibility Check

```typescript
// lib/refunds.ts
async function checkRefundEligibility(
  purchase: Purchase,
  user: User
): Promise<{ allowed: boolean; reason?: string }> {
  // Check time window
  const purchaseDate = new Date(purchase.created_at);
  const daysSincePurchase = differenceInDays(new Date(), purchaseDate);
  if (daysSincePurchase > REFUND_RULES.WINDOW_DAYS) {
    return { allowed: false, reason: 'Outside refund window' };
  }

  // Check watch percentage
  const watchStats = await getMuxWatchStats(purchase.lesson_id, user.id);
  if (watchStats.percentWatched > REFUND_RULES.MIN_WATCH_PERCENT) {
    return { allowed: false, reason: 'Exceeded watch limit' };
  }

  // Check monthly refund limit
  const recentRefunds = await getRecentRefunds(user.id);
  if (recentRefunds.length >= REFUND_RULES.MAX_REFUNDS_PER_USER_MONTH) {
    return { allowed: false, reason: 'Monthly refund limit reached' };
  }

  return { allowed: true };
}
```

### 3. Access Control Integration

```typescript
// hooks/use-lesson-access.ts
// Update access check to include refund status
const { data: purchase } = await supabase
  .from('purchases')
  .select('status')
  .eq('user_id', user.id)
  .eq('lesson_id', lessonId)
  .eq('status', 'completed')
  .neq('status', 'refunded') // Exclude refunded purchases
  .single();
```

## Key Features

1. Clear Refund Windows and Limits
   - 30-day refund window
   - Maximum 25% watch time for eligibility
   - 3 refunds per user per month
   - Automatic approval within first 24 hours

2. User and Creator Perspectives
   - Users can request refunds within limits
   - Creators can view refunds for their content
   - Platform maintains oversight

3. Record Keeping
   - Complete refund history
   - Audit trail of requests and decisions
   - Status tracking throughout process

4. Access Management
   - Immediate access revocation on refund
   - Clear status checks in access control
   - Proper handling of partial refunds

5. Security
   - Row Level Security policies
   - Proper authentication checks
   - Audit trail maintenance

## Testing Strategy

1. Unit Tests
   - Eligibility checks
   - Business rule validation
   - Status transitions

2. Integration Tests
   - Complete refund flow
   - Stripe integration
   - Access revocation

3. Edge Cases
   - Partial refunds
   - Multiple refund attempts
   - Concurrent requests

## Monitoring

1. Key Metrics
   - Refund rate by lesson
   - Average time to refund
   - Refund reasons distribution

2. Alerts
   - High refund rates
   - Failed refund processing
   - Stripe integration issues

## Deployment Checklist

1. Database
   - Create refunds table
   - Add RLS policies
   - Create indexes

2. Environment Variables
   - Stripe configuration
   - Refund window settings
   - Rate limits

3. Stripe Setup
   - Configure webhook endpoints
   - Test refund processing
   - Monitor integration

4. Monitoring
   - Set up logging
   - Configure alerts
   - Track key metrics
-e \n## File: ai_docs/misc/LOCAL_TEST_WRITING_PROMPT.md\n
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
-e \n## File: ai_docs/planning.md\n
# Feature Planning Template

## 1. Initial Analysis

### Core Requirements
- [ ] Feature purpose and goals
- [ ] User stories/requirements
- [ ] Success criteria
- [ ] Priority level

### Technical Scope
- [ ] Affected system areas (UI/API/DB/Auth/Payment)
- [ ] Integration points
- [ ] Data requirements
- [ ] Security considerations

### Complexity Assessment
```typescript
interface ComplexityAssessment {
  level: 'simple' | 'medium' | 'complex';
  factors: {
    ui: boolean;
    state: boolean;
    api: boolean;
    db: boolean;
    auth: boolean;
    payment: boolean;
  };
  effort: 'minimal lift' | 'moderate lift' | 'significant lift';
  scope: {
    size: 'focused' | 'broad' | 'system-wide';     // How many areas this touches
    impact: 'additive' | 'modifying' | 'breaking';  // How it affects existing code
    risk: 'low' | 'medium' | 'high';               // Potential for issues
  };
}
```

## 2. Architecture Planning

### Component Structure
- [ ] Atomic design level (atom/molecule/organism)
- [ ] Required props and interfaces
- [ ] State management needs
- [ ] Reuse opportunities

### Data Flow
- [ ] Data sources
- [ ] API endpoints needed
- [ ] State management approach
- [ ] Caching requirements

### Integration Points
- [ ] External services (Stripe/Mux/etc)
- [ ] Internal services
- [ ] Authentication requirements
- [ ] API contracts

## 3. Implementation Strategy

### UI Components
- [ ] Shadcn UI components needed
- [ ] Custom components required
- [ ] Accessibility requirements
- [ ] Responsive design needs

### Testing Strategy
```typescript
interface TestingStrategy {
  unit: string[];
  integration: string[];
  e2e: string[];
  performance: string[];
}
```

### Security Considerations
- [ ] Authentication requirements
- [ ] Authorization rules
- [ ] Data validation needs
- [ ] Security testing approach

## 4. Quality Assurance

### Performance Requirements
- [ ] Loading time targets
- [ ] Bundle size impact
- [ ] API response times
- [ ] Animation performance

### Testing Coverage
- [ ] Unit test scenarios
- [ ] Integration test cases
- [ ] E2E test flows
- [ ] Performance test cases

### Documentation Needs
- [ ] Component documentation
- [ ] API documentation
- [ ] Usage examples
- [ ] Configuration guide

## 5. Deployment Planning

### Environment Requirements
- [ ] Environment variables
- [ ] Service configurations
- [ ] Database changes
- [ ] API updates

### Release Strategy
- [ ] Deployment approach
- [ ] Feature flags needed
- [ ] Rollback plan
- [ ] Monitoring requirements

## 6. Post-Implementation

### Monitoring
- [ ] Performance metrics
- [ ] Error tracking
- [ ] Usage analytics
- [ ] User feedback

### Maintenance
- [ ] Update frequency
- [ ] Deprecation plan
- [ ] Version compatibility
- [ ] Support requirements

## Example Usage

```typescript
const featurePlan = {
  name: "Video Upload Component",
  complexity: {
    level: "medium",
    factors: {
      ui: true,
      state: true,
      api: true,
      db: false,
      auth: true,
      payment: false
    },
    effort: "moderate lift",
    scope: {
      size: "focused",      // Single feature area
      impact: "additive",   // Adds new functionality
      risk: "low"          // Well-understood integration
    }
  },
  components: [
    {
      name: "UploadButton",
      type: "atom",
      reusable: true
    },
    {
      name: "ProgressBar",
      type: "atom",
      reusable: true
    },
    {
      name: "VideoUploader",
      type: "molecule",
      reusable: true
    }
  ],
  testing: {
    unit: [
      "Upload button states",
      "Progress calculation",
      "Error handling"
    ],
    integration: [
      "Mux API integration",
      "Upload workflow"
    ],
    e2e: [
      "Complete upload flow"
    ],
    performance: [
      "Large file handling",
      "Concurrent uploads"
    ]
  }
};
```

## Checklist Summary

Before Implementation:
- [ ] Requirements clearly defined
- [ ] Technical scope understood
- [ ] Architecture planned
- [ ] Testing strategy defined
- [ ] Security considerations addressed
- [ ] Performance requirements set
- [ ] Documentation needs identified
- [ ] Deployment strategy planned

During Implementation:
- [ ] Following type safety guidelines
- [ ] Writing tests first
- [ ] Maintaining documentation
- [ ] Regular quality checks
- [ ] Performance monitoring
- [ ] Security validation

After Implementation:
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance verified
- [ ] Security validated
- [ ] Monitoring in place
- [ ] Maintenance plan defined
-e \n## File: ai_docs/branch_guides/MAIN_BRANCH_DEVELOPER_GUIDELINES.md\n
# Main Branch Additional Requirements

These requirements are specific to main branch development and reviews, supplementing the core DEVELOPER_GUIDELINES.md.

## Performance Thresholds
- Lighthouse score > 90: Maintain overall performance score above 90 in Lighthouse audits.
- First Contentful Paint < 1.5s: Ensure initial content renders within 1.5 seconds.
- Time to Interactive < 3.5s: Guarantee page becomes fully interactive within 3.5 seconds.

## Security Requirements
- OWASP Top 10 compliance: Meet all OWASP Top 10 security requirements.
- CSP headers configured: Implement Content Security Policy headers for all routes.
- Auth token handling review: Verify secure handling of authentication tokens.
- Proper error messages (no sensitive data leaks): Ensure error responses exclude sensitive information.

## Testing Coverage
- 100% test coverage for critical paths: Achieve complete test coverage for essential user journeys.
- Integration tests for auth flows: Verify all authentication workflows with integration tests.
- E2E tests for payment processes: Include end-to-end tests for payment functionality.
- Load testing for API endpoints: Conduct performance testing on all API routes.

## Deployment Safety
- Zero-downtime deployment plan: Document strategy for deploying without service interruption.
- Rollback procedure documented: Maintain clear instructions for reverting deployments.
- Database migration safety: Ensure database changes are backward compatible.
- CDN configuration review: Verify content delivery network settings are optimized.
-e \n## File: ai_docs/issue_reports/markdown-editor-feature.md\n
# ✅ COMPLETED: Add Markdown Editor for Lesson Content

## Overview
Successfully implemented a rich markdown editor component in the lesson creation form, allowing instructors to create detailed text content alongside their video lessons. Content is now stored in the lessons table's "content" column in Supabase.

## Completed Implementation

### Components Created/Modified
- Created new MarkdownEditor component with preview mode
- Updated LessonForm to integrate markdown editing
- Added content field to lesson schema
- Implemented database migration for content column

### Features Implemented
- Split-screen preview mode
- Markdown toolbar with formatting options
- Drag-and-drop image upload support
- Keyboard shortcuts for common actions
- Responsive design across devices
- ARIA-compliant accessibility features

### Testing Completed
- Unit tests for MarkdownEditor component ✅
- Integration tests for form submission ✅
- Content validation tests ✅
- Accessibility compliance tests ✅
- Image upload functionality tests ✅

## Verification

All acceptance criteria met:
1. ✅ Markdown editing and preview working
2. ✅ Content saves correctly to Supabase
3. ✅ Preview accurately reflects final rendering
4. ✅ All required markdown features supported
5. ✅ Editor is responsive and accessible
6. ✅ Form validation working properly
7. ✅ Image uploads functioning correctly
8. ✅ Content sanitization implemented

## Migration Notes
Database migration has been applied to production:
```sql
ALTER TABLE lessons ADD COLUMN content TEXT;
```

## Documentation
- Updated component documentation
- Added usage examples
- Updated testing guidelines

## Performance Impact
- Bundle size increase: +45KB (gzipped)
- No significant impact on page load time
- Editor initialization: ~100ms

## Security Considerations
- Content sanitization implemented
- XSS prevention measures in place
- Image upload size limits enforced

## Labels
- completed
- tested
- documented
-e \n## File: ai_docs/issue_reports/mux_integration_tests.md\n
# Mux Video Integration Tests Implementation

## Required Changes

### 1. Update jest.setup.ts
Add Mux-specific mocks and session storage mock for testing video components and lesson access.

Changes needed:
- Add @mux/mux-player-react mock
- Add @mux/mux-uploader-react mock
- Add session storage mock
- Add new icon mocks (AlertCircle, CheckCircle2, Upload, Loader2)

### 2. Create New Test Files

The following test files need to be created:

#### app/__tests__/hooks/use-lesson-access.test.tsx
Test the lesson access hook including:
- Cache validation (5 minute duration)
- Retry logic (3 attempts)
- Timeout handling (5 seconds)
- Purchase status verification
- Error state management

#### app/__tests__/components/ui/lesson-access-gate.test.tsx
Test the access gate component including:
- Loading states
- Error handling
- Purchase flow integration
- Conditional rendering based on access

#### app/__tests__/components/ui/video-uploader.test.tsx
Test the upload functionality including:
- Dynamic endpoint URL fetching
- Upload progress tracking
- Status transitions
- File validation
- Error handling

#### app/__tests__/components/ui/video-player.test.tsx
Test the video player including:
- JWT token generation for protected content
- Free vs paid content handling
- MuxPlayer integration
- Access control integration

### 3. Add Test Utilities to app/__tests__/utils/test-utils.tsx
Add helper functions for:
- Mock file creation
- Auth context rendering
- Mux component testing

## Implementation Order

1. First update jest.setup.ts with Mux mocks
2. Add test utilities to test-utils.tsx
3. Create use-lesson-access tests
4. Create component test files
5. Run test suite to verify coverage

## Required Dependencies

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event jest-environment-jsdom jest-fetch-mock
```

## Test Commands

```bash
# Run specific test suites
npm test -- use-lesson-access.test.tsx
npm test -- lesson-access-gate.test.tsx
npm test -- video-uploader.test.tsx
npm test -- video-player.test.tsx
```

## Notes
- All tests must verify purchase-based access control
- Include error handling scenarios
- Test timeout and retry logic
- Verify cleanup processes
-e \n## File: ai_docs/issue_reports/022425_video_player_tests.md\n
# Test Coverage Needed: Video Player Component

## Description
The VideoPlayer component has 0% test coverage and is critical for content delivery.

### Component Affected
- app/components/ui/video-player.tsx

## Current Status
- Current coverage: 0%
- Target coverage: 95%

## Technical Details

### Required Tests

#### Component Rendering
- Initial player state
- Loading indicator
- Error states
- Controls visibility
- Title display
- Price information
- Free content handling

#### Playback Features
- Play/Pause
- Seek functionality
- Volume control
- Quality selection
- Fullscreen toggle
- Playback rate

#### Integration
- Mux Player integration
- Stream initialization
- Error recovery
- Quality adaptation
- Analytics tracking

#### Accessibility
- Keyboard controls
- Screen reader support
- Caption handling
- ARIA attributes
- Focus management

## Test Implementation Plan

### Unit Tests
```typescript
describe('VideoPlayer', () => {
  it('renders with playback ID')
  it('shows loading state')
  it('handles errors')
  it('manages controls')
  it('supports accessibility')
  it('tracks analytics')
})
```

## Acceptance Criteria
- [ ] Component render tests
- [ ] Playback control tests
- [ ] Error handling coverage
- [ ] Accessibility tests
- [ ] Integration tests
- [ ] Analytics verification
- [ ] 95% test coverage

## Labels
- bug
- testing
- high-priority
- video
- player

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [Mux Player Documentation](https://docs.mux.com/player)
-e \n## File: ai_docs/issue_reports/022425_lesson_thumbnail_upload.md\n
# Feature: Lesson Thumbnail Upload Functionality

## Description
Currently, the lesson creation form lacks the ability for instructors to upload custom thumbnails for their lessons. All lessons are using default or placeholder thumbnails, which reduces visual appeal and makes it difficult for users to distinguish between lessons at a glance.

## Current Behavior
- Lessons are created with default/placeholder thumbnails
- No UI exists for instructors to upload or change thumbnails
- The `thumbnailUrl` field in the lesson object is populated with a generic image or left empty

## Expected Behavior
- Instructors should be able to upload custom thumbnail images during lesson creation
- Existing lessons should have an option to update thumbnails
- Thumbnails should be properly stored, optimized, and served
- Fallback to default thumbnails when none is provided

## Technical Analysis

### Affected Components
- `app/components/ui/lesson-form.tsx`: Needs to be updated to include thumbnail upload functionality
- `app/components/ui/video-uploader.tsx`: Can be referenced for similar upload pattern
- Database schema may need updates to properly store thumbnail metadata

### Implementation Requirements
1. Add image upload component to the lesson form
2. Implement server-side handling for image uploads
3. Add image optimization and processing
4. Update database schema if necessary
5. Implement proper error handling for failed uploads
6. Add validation for image dimensions, size, and format

### Code Examples

Potential implementation in lesson form:
```tsx
// Add to LessonFormProps interface
interface LessonFormProps {
  // existing props...
  initialThumbnail?: string;
}

// Add to form component
const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl || '');

// Add to form JSX
<FormField
  control={form.control}
  name="thumbnailUrl"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Lesson Thumbnail</FormLabel>
      <FormControl>
        <ImageUploader
          initialImage={thumbnailUrl}
          onUploadComplete={(url) => {
            setThumbnailUrl(url);
            field.onChange(url);
          }}
          onError={(error) => {
            toast({
              title: "Upload failed",
              description: error.message,
              variant: "destructive",
            });
          }}
          maxSizeMB={5}
          acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
        />
      </FormControl>
      <FormDescription>
        Upload a thumbnail image for your lesson (16:9 ratio recommended)
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### API Requirements
- Create a new API endpoint for thumbnail uploads
- Implement secure upload handling with proper validation
- Connect to storage service (Supabase Storage or similar)

## Testing Requirements
- Verify uploads work with various image formats (JPEG, PNG, WebP)
- Test with different image sizes and dimensions
- Verify error handling for invalid files
- Test thumbnail display in lesson cards and detail pages
- Verify mobile responsiveness of upload UI
- Test with slow network connections

## Environment Details
- All environments (development, staging, production)
- All devices (desktop and mobile)
- All modern browsers

## Additional Context
This feature is critical for instructors to properly brand and market their lessons. High-quality, relevant thumbnails significantly impact click-through rates and user engagement.

## Labels
- enhancement
- ui
- storage

## Priority
Medium - Important for instructor experience but not blocking core functionality
-e \n## File: ai_docs/issue_reports/video-upload-500-error.md\n
# Fix: Video Upload Fails with 500 Server Error

## Description
When attempting to upload a new video, the upload process fails with a 500 server error. The client-side console shows an error related to retrieving the asset ID from the upload.

## To Reproduce
1. Navigate to the video upload interface
2. Select a video file for upload
3. Initiate the upload process
4. Observe the upload fails with a 500 server error

## Expected Behavior
The video should upload successfully, and the system should return a valid asset ID that can be used for further processing or display.

## Technical Analysis
The error occurs in the client-side JavaScript when attempting to retrieve the asset ID after the upload. The server is responding with a 500 error, indicating a server-side issue rather than a client validation problem.

### Error Details
```
Failed to load resource: the server responded with a status of 500 ()
Error getting asset ID from upload: Error: Failed to get asset status
    at ta.V (page-14a43cc8d6e50375.js:1:14359)
```

This suggests that while the initial upload request might be processed, the subsequent request to get the asset status is failing on the server side.

## Affected Files
The issue likely involves these components:

1. `app/components/ui/video-uploader.tsx` - Client-side component handling the upload UI and initial request
2. `app/services/mux.ts` - Service handling Mux video integration
3. `app/api/video/` endpoints - Server-side API routes handling video uploads and status checks

## Potential Causes
1. Server-side error in processing the uploaded video
2. Incorrect or expired API credentials for the Mux service
3. Malformed request when checking asset status
4. Rate limiting or quota issues with the Mux API
5. Network or infrastructure issues between our server and Mux

## Suggested Investigation Steps
1. Check server logs for detailed error messages at the time of the 500 response
2. Verify Mux API credentials are valid and not expired
3. Examine the network requests in browser dev tools to see the exact request/response cycle
4. Test with a smaller video file to rule out size-related issues
5. Check if the issue occurs in all environments (development, staging, production)

## Testing Requirements
- Test with various video file formats (MP4, MOV, etc.)
- Test with different file sizes
- Verify behavior across different browsers
- Check both authenticated and unauthenticated states (if applicable)

## Environment
- Browser: [Browser information where the error was observed]
- OS: [Operating system information]
- Device: [Device information if relevant]
- App Version: [Current application version]

## Additional Context
This appears to be a regression as video uploads were previously working. Recent changes to the video upload flow or Mux integration might have introduced this issue.

## Labels
- bug
- high-priority

## Assignee
@me
-e \n## File: ai_docs/issue_reports/022425_video_components_tests.md\n
# Test Coverage Needed: Video Components

## Description
The video-related components currently have 0% test coverage and need comprehensive testing implementation.

### Components Affected
- app/components/ui/video-player.tsx
- app/components/ui/video-status.tsx
- app/components/ui/video-uploader.tsx

## Current Status
- Current coverage: 0%
- Target coverage: 80%

## Technical Details

### Required Tests

#### VideoPlayer
- Render with valid playback ID
- Handle missing playback ID
- Verify title display
- Test price display logic
- Verify free content handling
- Test player initialization
- Error state handling

#### VideoStatus
- Test all status states (pending, processing, ready, error)
- Error message display
- Loading state
- Status transitions
- className prop handling

#### VideoUploader
- File selection
- Upload progress tracking
- Success handling
- Error handling
- Size limit validation
- File type validation
- Pause/resume functionality
- Custom endpoint usage

## Test Implementation Plan

### Unit Tests
```typescript
describe('VideoComponents', () => {
  describe('VideoPlayer', () => {
    it('renders with valid playback ID')
    it('handles missing playback ID')
    it('displays title correctly')
    it('shows price information')
    it('handles free content')
    it('manages player initialization')
    it('handles errors appropriately')
  })

  describe('VideoStatus', () => {
    it('displays correct pending state')
    it('shows processing state')
    it('indicates ready state')
    it('handles error state')
    it('displays error messages')
  })

  describe('VideoUploader', () => {
    it('validates file selection')
    it('tracks upload progress')
    it('handles success state')
    it('manages error states')
    it('enforces size limits')
    it('validates file types')
  })
})
```

## Acceptance Criteria
- [ ] Unit tests for all components
- [ ] Integration tests for upload flow
- [ ] Error handling coverage
- [ ] Props validation tests
- [ ] Accessibility tests
- [ ] Mock MuxUploader properly
- [ ] Test coverage >95%
- [ ] Documentation updated
- [ ] CI pipeline passing

## Labels
- bug
- testing
- high-priority
- video
- accessibility

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [Video Component Specs](app/components/ui/video-player.tsx)
-e \n## File: ai_docs/issue_reports/add-lessons-to-header.md\n
# Add Lessons Page to Header Navigation

## Description
The lessons page needs to be added to the main navigation header to improve discoverability and provide direct access to the learning content.

## Technical Analysis

### Files to Update
- `app/components/ui/header.tsx`
  - Add lessons navigation item to the main navigation array
  - Include appropriate icon and description
  - Ensure proper routing and active state handling

### Implementation Details
1. Add new navigation item with:
   - Title: "Lessons"
   - Href: "/lessons"
   - Description: "Browse and access learning content"
   - Icon: BookOpen or similar from the icon set

2. Position in navigation:
   - Place after Dashboard (for logged-in users)
   - Before Requests section
   - Maintain consistent styling with other nav items

3. Accessibility considerations:
   - Ensure proper ARIA labels
   - Maintain keyboard navigation
   - Follow existing navigation patterns

### Testing Requirements
1. Visual verification:
   - Proper alignment with other nav items
   - Consistent styling
   - Responsive behavior on mobile

2. Functional testing:
   - Navigation works for both authenticated/unauthenticated users
   - Active state highlights correctly
   - Mobile menu behavior

3. Accessibility testing:
   - Screen reader compatibility
   - Keyboard navigation
   - Focus management

## Implementation Steps
1. Update header component navigation items
2. Add appropriate routing logic
3. Test across different viewports
4. Verify accessibility compliance

## Additional Context
This change supports the core learning experience by making lessons more discoverable and accessible from any page in the application.

Labels: enhancement, navigation, UI
-e \n## File: ai_docs/issue_reports/heic_video_support.md\n
# Add HEIC Video Support Investigation

## Description
We need to investigate and potentially add support for HEIC video files in our VideoUploader component to improve compatibility with iOS devices. This requires both technical investigation and implementation planning.

## Current State
The VideoUploader currently accepts:
```typescript
acceptedTypes = ['video/mp4', 'video/quicktime']
```

## Technical Investigation Required

### 1. Mux Platform Compatibility
- Verify if Mux supports HEIC video ingestion
- Document any Mux-specific requirements or limitations
- Check if format conversion is needed before upload

### 2. Client-Side Requirements
- Investigate browser support for HEIC format
- Research client-side conversion libraries if needed
- Evaluate performance implications

### 3. Implementation Dependencies
- Check @mux/mux-uploader-react version compatibility
- Identify any additional packages needed
- Review API endpoint modifications required

## Files Requiring Analysis
1. `app/components/ui/video-uploader.tsx`
2. `app/services/mux.ts`
3. Mux upload API route
4. Type definitions for Mux integration

## Questions to Answer
1. Does Mux natively support HEIC video ingestion?
2. Should we handle format conversion client-side or server-side?
3. What are the performance implications of HEIC support?
4. Do we need to modify our error handling for HEIC-specific cases?

## Next Steps
1. Technical investigation of Mux HEIC support
2. Browser compatibility research
3. Prototype implementation approach
4. Update issue with findings and specific implementation plan

## Labels
- investigation
- enhancement
- help wanted

## Notes
- HEIC (High Efficiency Image Container) is Apple's preferred format
- Implementation approach will depend on Mux platform capabilities
- May require client-side conversion solution
- Need to maintain current upload performance standards

## Updates
This issue will be updated with findings from the technical investigation to inform the implementation approach.
-e \n## File: ai_docs/issue_reports/categories_migration.md\n
**Description**
Currently, lesson request categories are hardcoded in `lesson-request.ts`. We need to move these to be dynamically loaded from Supabase's `categories` table to allow for better maintainability and admin control over categories.

**Current Implementation**
The categories are currently hardcoded in `lesson-request.ts` and used throughout the application. The Supabase database already has a `categories` table with the required schema, but it's not being utilized.

**Required Changes**

1. **New API Endpoint** (`app/api/categories/route.ts`):
   - GET endpoint to fetch all categories
   - Protected POST/DELETE endpoints for admin category management
   - Error handling and type safety

2. **Schema Updates** (`app/lib/schemas/lesson-request.ts`):
   - Remove hardcoded LESSON_CATEGORIES
   - Update zod schema to validate against dynamic categories
   - Add types for category data structure

3. **UI Components**:
   - Update RequestDialog to fetch and use dynamic categories
   - Add loading states and error handling
   - Maintain type safety with database types

4. **Data Migration**:
   - Script to populate initial categories from current hardcoded list
   - Verify existing lesson requests maintain category references

**Implementation Steps**

1. **API Layer**:
```typescript
// app/api/categories/route.ts
export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  // Return categories with proper error handling
}
```

2. **React Hook**:
```typescript
// app/hooks/useCategories.ts
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  // Fetch and cache categories
}
```

3. **Migration Script**:
```sql
-- Initial category data
INSERT INTO categories (name) VALUES
  ('Trick Tutorial'),
  ('Beginner Basics'),
  ('Advanced Techniques'),
  ('Combo Tutorial'),
  ('Theory & Concepts'),
  ('Style Development'),
  ('Competition Prep'),
  ('Other');
```

**Files to Update**

1. `app/requests/components/request-dialog.tsx`:
   - Replace LESSON_CATEGORIES with dynamic data
   - Add loading state to Select component
   - Handle potential fetch errors

2. `app/requests/components/request-sidebar.tsx`:
   - Update category filtering to use dynamic categories
   - Add loading state for category list

3. `app/api/requests/route.ts`:
   - Update category validation to check against database
   - Maintain backward compatibility during migration

4. `app/lib/schemas/lesson-request.ts`:
   - Remove static category list
   - Update schema validation

**Testing Requirements**

1. **Unit Tests**:
   - Category fetching hook
   - API endpoint responses
   - Schema validation with dynamic categories

2. **Integration Tests**:
   - Request creation flow
   - Category filtering
   - Error handling

3. **Migration Testing**:
   - Verify existing requests maintain categories
   - Test backward compatibility
   - Validate admin operations

**Additional Context**
This change leverages our existing Supabase categories table and maintains type safety throughout the implementation. It will enable future admin controls for category management while ensuring existing lesson requests remain valid.

**Success Criteria**
- All categories load dynamically from database
- Existing lesson requests maintain their categories
- Type safety is maintained throughout
- Loading states and error handling work correctly
- Admin can manage categories (future enhancement)
-e \n## File: ai_docs/issue_reports/022425_ui_components_tests.md\n
# Test Coverage Needed: UI Components

## Description
Several UI components have partial test coverage that needs improvement.

### Components Affected
- app/components/ui/lesson-form.tsx (40%)
- app/components/ui/request-card.tsx (41.5%)
- app/components/ui/header.tsx (48%)
- app/profile/components/profile-form.tsx (54.54%)

## Current Status
- Current coverage: 46.01% (average)
- Target coverage: 80%

## Technical Details

### Required Tests

#### LessonForm
- Form validation
- Submit handling
- Error states
- File upload integration
- Preview functionality
- Data persistence

#### RequestCard
- Render states
- Interaction handling
- Vote functionality
- Status updates
- Error handling

#### Header
- Navigation
- Auth state
- Mobile responsiveness
- Search functionality
- Menu interactions

#### ProfileForm
- Form validation
- Data updates
- Error handling
- Image upload
- Success states

## Test Implementation Plan

### Unit Tests
```typescript
describe('UI Components', () => {
  describe('LessonForm', () => {
    it('validates form inputs')
    it('handles submissions')
    it('manages error states')
    it('integrates file upload')
    it('shows preview correctly')
    it('persists form data')
  })

  describe('RequestCard', () => {
    it('renders all states')
    it('handles interactions')
    it('manages voting')
    it('updates status')
    it('displays errors')
  })

  describe('Header', () => {
    it('shows navigation')
    it('reflects auth state')
    it('adapts to mobile')
    it('enables search')
    it('manages menu state')
  })

  describe('ProfileForm', () => {
    it('validates inputs')
    it('updates data')
    it('handles errors')
    it('manages uploads')
    it('shows success')
  })
})
```

## Acceptance Criteria
- [ ] Unit tests for all components
- [ ] Integration tests for forms
- [ ] Error handling coverage
- [ ] UI interaction tests
- [ ] Accessibility tests
- [ ] Responsive design tests
- [ ] Test coverage >90%
- [ ] Documentation updated
- [ ] Visual regression tests
- [ ] Performance metrics met

## Labels
- bug
- testing
- ui
- enhancement
- accessibility
- documentation

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [UI Components](app/components/ui/)
-e \n## File: ai_docs/issue_reports/022425_api_routes_tests.md\n
# Test Coverage Needed: API Routes

## Description
API routes currently have 0% test coverage across all endpoints.

### Routes Affected
- app/api/checkout/*
- app/api/lessons/*
- app/api/mux/*
- app/api/stripe/*
- app/api/webhooks/*

## Current Status
- Current coverage: 0%
- Target coverage: 90%

## Technical Details

### Required Tests

#### Checkout API
- Payment initialization
- Session creation
- Error handling
- Input validation
- Success responses

#### Lessons API
- CRUD operations
- Access control
- Data validation
- Error handling
- Query parameters

#### Mux API
- Upload tokens
- Webhook handling
- Asset management
- Error states
- Response validation

#### Stripe API
- Payment processing
- Webhook handling
- Account management
- Error handling
- Event validation

## Test Implementation Plan

### Unit Tests
```typescript
describe('API Routes', () => {
  describe('Checkout API', () => {
    it('initializes payment session')
    it('validates input data')
    it('handles successful payment')
    it('manages failed payments')
    it('enforces authentication')
  })

  describe('Lessons API', () => {
    it('performs CRUD operations')
    it('validates access control')
    it('handles query parameters')
    it('manages file uploads')
    it('enforces data validation')
  })

  describe('Mux API', () => {
    it('generates upload tokens')
    it('processes webhooks')
    it('manages assets')
    it('handles errors')
    it('validates responses')
  })

  describe('Stripe API', () => {
    it('processes payments')
    it('handles webhooks')
    it('manages accounts')
    it('validates events')
    it('handles refunds')
  })
})
```

## Acceptance Criteria
- [ ] Unit tests for all endpoints
- [ ] Integration tests for API flows
- [ ] Error handling coverage
- [ ] Input validation tests
- [ ] Authentication tests
- [ ] Response format tests
- [ ] Test coverage >95%
- [ ] API documentation updated
- [ ] Security tests passing
- [ ] Performance tests added

## Labels
- bug
- testing
- api
- critical
- security
- documentation

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [API Documentation](app/api/)
-e \n## File: ai_docs/issue_reports/022425_sign_in_tests.md\n
# Test Coverage Needed: Sign In Component

## Description
The SignIn component currently has 0% test coverage and requires comprehensive test implementation.

### Component Affected
- app/components/ui/sign-in.tsx

## Current Status
- Current coverage: 0%
- Target coverage: 100% (auth is critical)

## Technical Details

### Required Tests

#### Component Rendering
- Initial render state
- Form field validation
- Password field masking
- Error message display
- Loading indicator
- "Switch to Sign Up" link

#### Form Interactions
- Email input validation
- Password input validation
- Submit button state management
- Form submission handling
- Error state handling
- Loading state during submission

#### Integration
- AuthContext integration
- Navigation after success
- Error handling from auth service
- Session management
- Redirect handling

#### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Error announcements

## Test Implementation Plan

### Unit Tests
```typescript
describe('SignIn', () => {
  it('renders form fields correctly')
  it('validates email format')
  it('handles empty submissions')
  it('shows loading state')
  it('displays auth errors')
  it('navigates on success')
  it('manages focus correctly')
})
```

## Acceptance Criteria
- [ ] All unit tests implemented
- [ ] Integration tests with AuthContext
- [ ] Accessibility tests passing
- [ ] Error handling coverage
- [ ] Loading states verified
- [ ] Navigation flows tested
- [ ] 100% test coverage achieved

## Labels
- bug
- testing
- security
- critical
- authentication

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [Auth Implementation](app/services/auth/AuthContext.tsx)
-e \n## File: ai_docs/issue_reports/remove-coming-soon.md\n
# Remove Coming Soon Page

## Description
The Coming Soon page needs to be removed now that we are ready for full launch. After code review, this is a simple removal as the page is not referenced in navigation or other components.

## Technical Analysis

### Files Affected:
- app/coming-soon/page.tsx - Delete entire file

### Type of Changes:
- Simple deletion of Coming Soon page component
- No navigation or routing updates needed

## Steps to Reproduce Current Behavior
1. Visit /coming-soon route
2. Note Coming Soon page displays with "Return Home" button

## Expected Behavior After Changes
1. /coming-soon route should return 404 (no special redirect needed since page wasn't linked from anywhere)
2. All other routes and functionality remain unchanged

## Testing Requirements
- Verify /coming-soon route returns appropriate 404
- Verify no regressions in main navigation
- Test on both desktop and mobile viewports

## Implementation Notes
- Simple deletion of app/coming-soon/page.tsx
- No other changes required

## Labels
- cleanup
- good first issue

## Priority
Low

## Estimated Effort
Very Small (< 30 minutes)
-e \n## File: ai_docs/issue_reports/video_uploader_error.md\n
# Video Uploader Error Report

## Issue Description
The VideoUploader component is throwing a generic "Failed to get upload URL" error without providing sufficient context about the underlying cause.

## Error Details
```
Error: Failed to get upload URL
Location: app/components/ui/video-uploader.tsx (73:13)
Component: VideoUploader.useCallback[getUploadUrl]
```

## Technical Analysis
1. The current error handling is too generic and doesn't provide enough information for debugging
2. No HTTP status code or response details are included in the error
3. No retry mechanism is implemented
4. Error doesn't propagate useful information from the server response

## Proposed Solutions
1. Enhance error message with HTTP status code and response details
2. Add retry mechanism for transient failures
3. Parse and include server error messages when available
4. Add detailed logging for debugging purposes

## Implementation Plan
1. Modify getUploadUrl to include response details in error message
2. Add retry logic for 5xx errors
3. Improve error handling to parse server error messages
4. Add debug logging throughout the upload process

## Testing Requirements
- Test various HTTP error scenarios
- Verify retry mechanism works as expected
- Confirm error messages are helpful for debugging
- Validate logging provides necessary debug information
-e \n## File: ai_docs/issue_reports/022425_auth_components_tests.md\n
# Test Coverage Needed: Authentication Components

## Description
Authentication components have critically low test coverage and need immediate attention.

### Components Affected
- app/components/ui/sign-in.tsx (0%)
- app/components/ui/sign-up.tsx (50%)
- app/services/auth/AuthContext.tsx (6.45%)

## Current Status
- Current coverage: 18.82% (average)
- Target coverage: 90% (auth is critical)

## Technical Details

### Required Tests

#### SignIn Component
- Render validation
- Form submission
- Error handling
- Navigation to sign up
- Loading states
- Input validation
- Auth integration

#### SignUp Component
- Form rendering
- Validation logic
- Submission handling
- Error states
- Navigation to sign in
- Terms acceptance
- Password requirements

#### AuthContext
- Provider initialization
- Session management
- User state updates
- Authentication flow
- Error handling
- Loading states
- Hook usage

## Acceptance Criteria
- [ ] Unit tests for all components
- [ ] Integration tests for auth flow
- [ ] Session management tests
- [ ] Error handling coverage
- [ ] Loading state tests
- [ ] Hook usage tests
- [ ] Test coverage >90%

## Labels
- bug
- testing
- security
- critical

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [Auth Implementation](app/services/auth/AuthContext.tsx)
-e \n## File: ai_docs/issue_reports/022425_video_upload_tests.md\n
# Test Coverage Needed: Video Upload Component

## Description
The VideoUploader component has 0% test coverage and handles critical file upload functionality.

### Component Affected
- app/components/ui/video-uploader.tsx

## Current Status
- Current coverage: 0%
- Target coverage: 95%

## Technical Details

### Required Tests

#### Component Rendering
- Initial state
- Upload zone display
- Progress indicator
- Error messages
- Success state
- Pause/Resume controls

#### Upload Functionality
- File selection
- File validation
  - Size limits
  - File types
  - Resolution checks
- Upload progress tracking
- Cancel upload
- Pause/Resume handling
- Retry on failure

#### Integration
- Mux API integration
- Error handling
- Upload completion
- Asset creation
- Webhook handling

#### Edge Cases
- Network failures
- Invalid files
- Timeout handling
- Concurrent uploads
- Browser compatibility

## Test Implementation Plan

### Unit Tests
```typescript
describe('VideoUploader', () => {
  it('renders upload zone')
  it('validates file types')
  it('checks file size')
  it('shows progress')
  it('handles errors')
  it('manages upload state')
  it('supports pause/resume')
})
```

## Acceptance Criteria
- [ ] Component render tests
- [ ] File validation tests
- [ ] Upload flow tests
- [ ] Error handling coverage
- [ ] Progress tracking tests
- [ ] Integration tests
- [ ] Edge case coverage
- [ ] 95% test coverage

## Labels
- bug
- testing
- high-priority
- video
- upload

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [Mux Documentation](https://docs.mux.com)
-e \n## File: ai_docs/LAUNCH_PLAN.md\n
# Launch Plan Checklist

## Pre-Launch Testing (T-5 days)

### Code Quality & Testing
- [ ] Run full test suite (`npm test && vercel build`)
- [ ] Verify test coverage is >80%
- [ ] Run ESLint across all files
- [ ] Check for any remaining "any" types in TypeScript
- [ ] Verify all components have proper prop types
- [ ] Run accessibility (WCAG) checks
- [ ] Review error boundaries implementation
- [ ] Check for memory leaks in React components
- [ ] Verify all forms have proper Zod validation
- [ ] Run bundle analysis
- [ ] Check Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Review console for warnings/errors
- [ ] Verify component documentation standards
- [ ] Check shadcn/ui component usage
- [ ] Test all custom hooks
- [ ] Verify proper memoization usage
- [ ] Verify all components follow Atomic Design principles
- [ ] Check accessibility testing with screen readers
- [ ] Run tests in CI pipeline
- [ ] Verify component co-location standards
- [ ] Check feature-based organization structure

### Current Test Coverage Status
- Overall coverage: 24.72% (target: >80%)
- Coverage breakdown:
  - Statements: 24.72%
  - Branches: 19.94%
  - Functions: 33.62%
  - Lines: 25.07%

- Critical areas needing tests:
  - Authentication components (sign-in.tsx: 0%, sign-up.tsx: 50%)
  - Video components (video-player.tsx: 0%, video-status.tsx: 0%, video-uploader.tsx: 0%)
  - Auth services (AuthContext.tsx: 6.45%, supabaseAuth.ts: 18.51%)
  - API routes (most at 0% coverage)
  - UI components (many below 50%)
  - Hooks (useCategories.ts: 71.42%, useLessonAccess.ts: 0%)

- Priority files to test (0% coverage):
  - app/components/ui/video-player.tsx
  - app/components/ui/video-status.tsx
  - app/components/ui/video-uploader.tsx
  - app/components/ui/sign-in.tsx
  - app/hooks/useLessonAccess.ts
  - app/services/auth/AuthContext.tsx
  - app/services/mux.ts
  - app/api/* routes (checkout, lessons, mux, stripe, webhooks)

- Components with partial coverage to improve:
  - app/components/ui/lesson-form.tsx (40%)
  - app/components/ui/request-card.tsx (41.5%)
  - app/components/ui/header.tsx (48%)
  - app/components/ui/sign-up.tsx (50%)
  - app/profile/components/profile-form.tsx (54.54%)
  - app/services/supabase.ts (60%)

- Well-tested components (100% coverage):
  - app/components/ui/accordion.tsx
  - app/components/ui/button.tsx
  - app/components/ui/card.tsx
  - app/components/ui/dialog.tsx
  - app/components/ui/input.tsx
  - app/components/ui/label.tsx
  - app/components/ui/lesson-grid.tsx
  - app/components/ui/switch.tsx
  - app/components/ui/tabs.tsx
  - app/components/ui/textarea.tsx
  - app/profile/components/payment-management.tsx

### Authentication & Security
- [ ] Test all auth flows:
  - [ ] Sign up with email
  - [ ] Sign in with email
  - [ ] Password reset flow
  - [ ] Email verification
  - [ ] OAuth providers (Google)
  - [ ] Sign out flow
- [ ] Verify route protection with Supabase middleware
- [ ] Check RBAC implementation and permissions
- [ ] Audit API routes for proper auth middleware
- [ ] Review security headers (CSP configuration)
- [ ] Test CSRF protection
- [ ] Verify secure session handling with Supabase
- [ ] Check rate limiting implementation
- [ ] Test AuthContext provider
- [ ] Verify protected routes in app router
- [ ] Check auth error handling
- [ ] Test auth state persistence

### Payment Integration
- [ ] Test complete Stripe payment flow
- [ ] Verify webhook handling
- [ ] Test creator payout system
- [ ] Check error handling for failed payments
- [ ] Verify payment success/failure notifications
- [ ] Test refund process
- [ ] Verify Stripe Connect onboarding
- [ ] Check payment analytics
- [ ] Test subscription management (if applicable)

### Video Platform
- [ ] Test video upload flow with Mux
- [ ] Verify video playback across browsers
- [ ] Check video processing pipeline
- [ ] Test video access controls
- [ ] Verify Mux webhook handling
- [ ] Check video analytics implementation
- [ ] Test video player features
- [ ] Verify thumbnail generation
- [ ] Check upload size limits
- [ ] Test pause/resume functionality
- [ ] Verify video status tracking
- [ ] Check video error handling
- [ ] Test video preview functionality
- [ ] Verify proper cleanup of failed uploads

### Database & Data
- [ ] Run database migrations
- [ ] Verify backup system
- [ ] Test data recovery procedures
- [ ] Check database indexes
- [ ] Verify Zod schema validation
- [ ] Test data export functionality
- [ ] Review Supabase RLS policies
- [ ] Check query optimization
- [ ] Verify proper error handling
- [ ] Test real-time subscriptions
- [ ] Check data transformation layers
- [ ] Verify repository pattern implementation
- [ ] Test database connection pooling
- [ ] Review data access patterns

## Environment Setup (T-3 days)

### Configuration
- [ ] Verify all required env variables in production
- [ ] Check database connection strings
- [ ] Review API keys and permissions
- [ ] Verify proper environment separation
- [ ] Check logging configuration
- [ ] Set up error tracking
- [ ] Configure monitoring alerts
- [ ] Verify preview deployments for PRs
- [ ] Test zero-downtime deployment
- [ ] Check automated rollback functionality
- [ ] Verify environment variable management in Vercel

### Performance
- [ ] Run performance tests
- [ ] Check CDN configuration
- [ ] Verify caching strategy
- [ ] Test load balancing
- [ ] Review API response times
- [ ] Check image optimization
- [ ] Verify lazy loading implementation

### Content & SEO
- [ ] Review all content for accuracy
- [ ] Check meta tags
- [ ] Verify robots.txt
- [ ] Submit sitemap
- [ ] Test social media previews
- [ ] Check canonical URLs
- [ ] Verify structured data

## Final Checks (T-1 day)

### User Experience
- [ ] Test responsive design
- [ ] Check cross-browser compatibility
- [ ] Verify form validation messages
- [ ] Test error messages
- [ ] Check loading states
- [ ] Verify success notifications
- [ ] Review UI consistency
- [ ] Test Edge Function performance
- [ ] Verify Core Web Vitals monitoring setup
- [ ] Check route-based code splitting
- [ ] Test creator dashboard features
- [ ] Verify lesson request system

### Analytics & Monitoring
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Verify analytics tracking
- [ ] Set up custom events
- [ ] Check conversion tracking
- [ ] Test monitoring alerts
- [ ] Verify logging

### Documentation
- [ ] Update API documentation
- [ ] Review user guides
- [ ] Check support documentation
- [ ] Update FAQs
- [ ] Verify contact information
- [ ] Review legal documents
- [ ] Verify ai_docs/ is up to date
- [ ] Check README.md completeness
- [ ] Review component documentation
- [ ] Verify code comments follow minimalist standard

### Feature Organization
- [ ] Verify feature directory structure
- [ ] Check component co-location
- [ ] Verify test co-location in __tests__ directories
- [ ] Review API route grouping
- [ ] Check service integration organization

### Backup & Recovery
- [ ] Test backup procedures
- [ ] Verify restore process
- [ ] Document recovery steps
- [ ] Check backup automation
- [ ] Test failover systems

## Launch Day

### Pre-Launch
- [ ] Final database backup
- [ ] Team communication check
- [ ] Verify monitoring systems
- [ ] Check all services status
- [ ] Review emergency procedures

### Launch Steps
1. [ ] Update DNS records
2. [ ] Deploy to production
3. [ ] Run smoke tests
4. [ ] Check all critical paths
5. [ ] Monitor error rates
6. [ ] Watch performance metrics

### Post-Launch
- [ ] Monitor user activity
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Watch payment processing
- [ ] Monitor video uploads
- [ ] Check authentication flows
- [ ] Verify email delivery

### Communication
- [ ] Send launch announcements
- [ ] Update status page
- [ ] Monitor social media
- [ ] Check support channels
- [ ] Brief support team

## Emergency Procedures

### Rollback Plan
1. Trigger immediate database backup
2. Revert to previous deployment
3. Update DNS if needed
4. Notify users of maintenance

### Service Status Pages
- Stripe: https://status.stripe.com
- Mux: https://status.mux.com
- Supabase: https://status.supabase.com
- Vercel: https://www.vercel-status.com

Remember to maintain this checklist during the launch process and update it with any additional items specific to your deployment.
-e \n## File: ai_docs/checks/testing.md\n
# Testing Standards

## Core Testing Requirements

```typescript
interface TestRequirement {
  type: 'unit' | 'integration' | 'e2e';
  coverage: number;
  required: boolean;
  tools: string[];
}

interface TestConfig {
  simple: TestRequirement[];
  medium: TestRequirement[];
  complex: TestRequirement[];
}
```

## Coverage Requirements

### Unit Tests
- Simple: 70% coverage
- Medium: 80% coverage
- Complex: 90% coverage

### Integration Tests
- Simple: Optional
- Medium: Key flows only
- Complex: Full coverage

### E2E Tests
- Simple: Happy path
- Medium: Core flows
- Complex: Full flows + edge cases

## Test Implementation

### Unit Tests
- Jest for component testing
- React Testing Library
- Mock external dependencies
- Snapshot testing when appropriate

### Integration Tests
- API contract testing
- Database interactions
- Service integration
- State management

### E2E Tests
- Playwright for browser testing
- Critical user journeys
- Cross-browser verification
- Performance monitoring
-e \n## File: ai_docs/checks/performance.md\n
# Performance Standards

## Core Performance Requirements

```typescript
interface PerformanceMetric {
  name: string;
  threshold: number;
  critical: boolean;
  measurement: 'FCP' | 'LCP' | 'CLS' | 'TTI';
}

interface PerformanceConfig {
  metrics: PerformanceMetric[];
  monitoring: string[];
  optimization: string[];
}
```

## Performance Metrics

### Core Web Vitals
- FCP (First Contentful Paint): < 1.8s
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.8s

### React Performance
- Component render time
- Re-render frequency
- Bundle size limits
- Memory usage

### API Performance
- Response time < 100ms
- Time to first byte
- Cache hit ratio
- Error rate < 0.1%

## Implementation

### Development Checks
- Lighthouse scores
- Bundle analysis
- React profiler
- Memory leaks

### Production Monitoring
- Real user monitoring
- Performance tracking
- Error tracking
- Usage analytics
-e \n## File: ai_docs/checks/typescript.md\n
# TypeScript Quality Standards

## Core Requirements

1. Type Safety
- No use of 'any' type
- No type assertions without validation
- All props and returns typed
- Generic types properly constrained

2. Interface Definitions
- Clear and descriptive names
- Proper documentation
- Minimal dependencies
- Single responsibility

3. Type Checking

```typescript
interface TypeCheck {
  severity: 'error' | 'warning';
  category: 'safety' | 'style' | 'performance';
  autofix: boolean;
}

const typeChecks: Record<string, TypeCheck> = {
  noImplicitAny: {
    severity: 'error',
    category: 'safety',
    autofix: false
  },
  strictNullChecks: {
    severity: 'error',
    category: 'safety',
    autofix: false
  },
  noUncheckedIndexedAccess: {
    severity: 'error',
    category: 'safety',
    autofix: false
  }
};
```

## Complexity-Based Requirements

### Simple Changes
- Basic type safety
- Props and returns typed
- No type assertions

### Medium Changes
- Full type safety
- Generic constraints
- Type guards where needed

### Complex Changes
- Advanced type safety
- Custom type guards
- Type testing
- Performance optimization
-e \n## File: ai_docs/checks/security.md\n
# Security Standards

## Core Security Requirements

```typescript
interface SecurityCheck {
  level: 'critical' | 'high' | 'medium' | 'low';
  automated: boolean;
  frequency: 'pre-commit' | 'pre-merge' | 'scheduled';
}

interface SecurityConfig {
  checks: SecurityCheck[];
  tools: string[];
  compliance: string[];
}
```

## Security Checks

### Authentication
- Supabase Auth implementation
- Session management
- Token handling
- Access control

### Data Protection
- Input validation
- Output sanitization
- SQL injection prevention
- XSS protection

### API Security
- Rate limiting
- Request validation
- Error handling
- CORS configuration

## Implementation

### Pre-commit Checks
- Secret detection
- Basic security linting
- Dependency scanning

### Pre-merge Checks
- Full security scan
- Vulnerability assessment
- License compliance
- SAST (Static Application Security Testing)

### Production Checks
- DAST (Dynamic Application Security Testing)
- Penetration testing
- Security monitoring
- Incident response
-e \n## File: ai_docs/HOW_TO_USE.md\n
# Using the Adaptive Development System

## Overview

This guide walks you through using our AI-driven development system. The system adapts its requirements and checks based on your change's type and complexity.

## Quick Start Guide

### 1. Start with Planning
```bash
# Create a new feature plan
cp ai_docs/planning.md planning/your-feature.md
```

Open your new planning document and:
- Define core requirements
- Assess technical scope
- Plan architecture
- Define testing strategy

### 2. Configure Your Change
After planning, create your change configuration:

```typescript
// In your planning document:
const changeConfig = {
  // Type of change
  changeType: 'feature',  // feature, fix, docs, refactor
  
  // Assessed complexity from planning
  complexity: 'medium',   // simple, medium, complex
  
  // Time sensitivity
  urgency: 'normal',     // normal, urgent
  
  // Areas affected and testing needs
  scope: {
    // System areas this touches
    affects: ['ui', 'api'],
    
    // Required test types
    testingRequired: ['unit', 'integration', 'e2e']
  }
}
```

This configuration determines:
- Quality gate requirements
- Testing depth needed
- AI assistance level
- Review process rigor

### 3. Start Development
```bash
# Create your branch (based on change type)
git checkout -b feature/your-feature dev   # For features
git checkout -b fix/issue-123 dev          # For fixes
git checkout -b docs/api-docs dev          # For docs

# Get relevant workflow requirements
cat ai_docs/workflows/feature.md           # For features
cat ai_docs/workflows/fix.md               # For fixes
cat ai_docs/workflows/docs.md              # For docs
```

## Change Types

### Feature Development
1. Plan
   - Review feature.md workflow
   - Use prompts/feature/ templates
   - Define component structure

2. Implement
   - Follow TypeScript standards
   - Use Shadcn UI components
   - Write tests first

3. Review
   - Run quality checks
   - Use AI code review
   - Update documentation

### Bug Fixes
1. Analyze
   - Document reproduction steps
   - Identify root cause
   - Plan fix approach

2. Fix
   - Implement solution
   - Add regression tests
   - Update documentation

3. Verify
   - Run full test suite
   - Check performance impact
   - Update changelog

### Documentation
1. Plan
   - Identify documentation needs
   - Choose documentation type
   - Select template

2. Write
   - Follow documentation standards
   - Include code examples
   - Add type information

3. Review
   - Verify accuracy
   - Check completeness
   - Update references

## Quality Gates

### Development Gate
```bash
# Run type checks
npm run typecheck

# Run unit tests
npm run test:unit

# Check coverage
npm run test:coverage
```

### Integration Gate
```bash
# Run integration tests
npm run test:integration

# Check performance
npm run test:performance

# Verify build
npm run build
```

### Production Gate
```bash
# Run E2E tests
npm run test:e2e

# Security scan
npm run security:audit

# Build production
npm run build:production
```

## AI Assistance

### Using AI Prompts
1. Choose appropriate prompt template
2. Provide context about the change
3. Follow AI suggestions
4. Verify results

### Code Review
1. Use prompts/review/code-review.md
2. Follow review checklist
3. Address AI feedback
4. Verify fixes

## Common Workflows

For detailed Git workflows and standards, see [Git Standards](standards/git.md).

### New Feature
```bash
# 1. Create feature branch (see git.md for naming conventions)
git checkout -b feature/new-component dev

# 2. Review requirements
cat ai_docs/workflows/feature.md

# 3. Use AI prompts
cat ai_docs/prompts/feature/component.md

# 4. Implement with tests
npm run test:watch

# 5. Run quality checks
npm run check:all

# 6. Create PR
gh pr create
```

### Bug Fix
```bash
# 1. Create fix branch (see git.md for naming conventions)
git checkout -b fix/issue-123 dev

# 2. Review requirements
cat ai_docs/workflows/fix.md

# 3. Implement fix
npm run test:watch

# 4. Verify fix
npm run test:all

# 5. Create PR
gh pr create
```

## Tips & Best Practices

1. Always start with configuration
- Define change type
- Assess complexity
- Determine scope

2. Use appropriate templates
- Check workflow docs
- Use AI prompts
- Follow checklists

3. Run checks early
- Type checking
- Unit tests
- Linting

4. Review thoroughly
- Use AI review
- Check standards
- Verify changes

5. Document everything
- Update docs
- Add comments
- Write clear commits

## Troubleshooting

### Common Issues

1. Failed Quality Gates
- Review error messages
- Check requirements
- Run specific tests
- Update as needed

2. AI Assistance
- Provide more context
- Use specific prompts
- Verify suggestions
- Iterate if needed

3. Workflow Questions
- Check documentation
- Review examples
- Ask for help
- Update docs

## Support

- Review ai_docs/ directory
- Check workflow documentation and git standards
- Use AI assistance
- Update documentation

Remember: The system adapts to your changes. Always check the specific requirements for your change type and complexity level.
-e \n## File: ai_docs/workflows/fix.md\n
# Bug Fix Workflow

## Overview
This document defines the workflow for bug fixes, from identification through verification.

## Configuration

```typescript
interface BugfixWorkflow extends WorkflowConfig {
  changeType: 'fix';
  analysis: {
    patterns: boolean;    // Similar bug patterns
    regression: boolean;  // Regression testing
    security: boolean;    // Security implications
  };
}
```

## Quality Gates

### Analysis Gate
- Bug reproduction
- Root cause identification
- Impact assessment
- Security review

### Implementation Gate
- Fix verification
- Regression testing
- Type safety check
- Test coverage

### Verification Gate
- Integration testing
- Performance impact
- Security validation
- Documentation update

## AI Assistance Levels

### Analysis Phase
- Pattern recognition
- Similar issue identification
- Root cause analysis
- Impact assessment

### Implementation Phase
- Code review
- Test case generation
- Regression testing
- Security validation

### Verification Phase
- Fix validation
- Performance impact
- Documentation review
- Release notes
-e \n## File: ai_docs/workflows/feature.md\n
# Feature Development Workflow

## Overview
This document defines the workflow for feature development, from initial conception through production deployment.

## Configuration

```typescript
interface FeatureWorkflow extends WorkflowConfig {
  changeType: 'feature';
  requirements: {
    atomic: boolean;    // Atomic design principles
    modular: boolean;   // Component modularity
    reusable: boolean;  // Reusability focus
  };
}
```

## Quality Gates

### Development Gate
- Type safety check
- Unit test coverage (per complexity)
- Component documentation
- Accessibility compliance

### Integration Gate
- Integration tests
- Performance benchmarks
- API documentation
- Cross-browser testing

### Production Gate
- E2E testing
- Security audit
- Load testing
- Documentation complete

## AI Assistance Levels

### Planning Phase
- Component structure suggestions
- Reusability opportunities
- Testing strategy
- Performance considerations

### Implementation Phase
- Code review assistance
- Test case generation
- Documentation templates
- Security validation

### Review Phase
- Quality gate verification
- Performance analysis
- Accessibility checking
- Documentation review
-e \n## File: ai_docs/ISSUE_REPORT.md\n
# Issue Creation Workflow

This document outlines the standardized process for creating detailed GitHub issues using AI assistance and the GitHub CLI.

## Overview

The issue creation pipeline follows these steps:
1. User provides initial issue description
2. AI assistant expands and formats the issue
3. AI identifies affected files
4. Issue is created via GitHub CLI

## Step 1: Initial Issue Description

Provide a clear, concise description of the issue including:
- What's not working
- Steps to reproduce
- Expected behavior
- Environment details (OS, browser, etc.)

Example:
```
Describe the bug: The dropdown menu component in the request dialog is not functioning properly 
on mobile devices. The menu either fails to open or doesn't respond to touch interactions.

To Reproduce:
1. Go to '/requests' page
2. Open the request dialog
3. Attempt to interact with the dropdown menu on a mobile device

Expected behavior: The dropdown menu should open smoothly on touch interaction and allow selection
of options, matching the behavior seen on desktop devices.

Environment:
- OS: iOS and Android (mobile devices)
- Browser: Mobile Safari, Chrome Mobile
```

## Step 2: AI Issue Formatting

The AI assistant will:
1. Expand the issue description
2. Add technical analysis
3. Format according to our template
4. Save to `ai_docs/scratchpad.md`

The expanded issue will include:
- Detailed description
- Reproduction steps
- Technical analysis
- Code examples
- Environment details
- Testing requirements
- Additional context

## Step 3: File Analysis

The AI assistant will identify:
1. Files that need to be updated
2. Type of changes needed
3. Testing requirements

This analysis is added to the issue report in `scratchpad.md`.

## Step 4: Creating the GitHub Issue

1. First, check available labels:
```bash
gh label list
```

2. Create the issue using GitHub CLI:
```bash
gh issue create --title "Fix: [Issue Name]" --body "$(cat ai_docs/scratchpad.md)" --label "bug" --assignee "@me"
```

Additional label options in our repository:
- bug (#d73a4a)
- documentation (#0075ca)
- enhancement (#a2eeef)
- good first issue (#7057ff)
- help wanted (#008672)
- question (#d876e3)

NAME              DESCRIPTION                                 COLOR  
bug               Something isn't working                     #d73a4a
documentation     Improvements or additions to documentation  #0075ca
duplicate         This issue or pull request already exists   #cfd3d7
enhancement       New feature or request                      #a2eeef
good first issue  Good for newcomers                          #7057ff
help wanted       Extra attention is needed                   #008672
invalid           This doesn't seem right                     #e4e669
question          Further information is requested            #d876e3
wontfix           This will not be worked on                  #ffffff

## Best Practices

1. **Issue Titles**
   - Start with type: "Fix:", "Feature:", "Docs:", etc.
   - Be specific but concise
   - Include affected component

2. **Labels**
   - Always include at least one label
   - Use multiple labels when appropriate
   - Create new labels through GitHub UI if needed

3. **Assignments**
   - Use "@me" to self-assign
   - Only assign to others if pre-arranged
   - Consider using "help wanted" label instead

4. **Issue Content**
   - Follow the template structure
   - Include all relevant technical details
   - Add screenshots if applicable
   - Link to related issues/PRs

## Example Workflow

```bash
# 1. User describes issue to AI assistant
# 2. AI expands and formats issue in scratchpad.md
# 3. Check available labels
gh label list

# 4. Create issue with appropriate labels
gh issue create --title "Fix: Mobile Select Menu Interaction Issues" \
  --body "$(cat ai_docs/scratchpad.md)" \
  --label "bug" \
  --assignee "@me"
```

This standardized process ensures consistent, detailed issue reports that help developers understand and resolve problems efficiently.
-e \n## File: ai_docs/scratchpad.md\n
# Mobile Select Menu Interaction Issues

## Description
The Select menu component in the request dialog is not functioning properly on mobile devices. The menu either fails to open or doesn't respond to touch interactions correctly. This appears to be due to positioning and touch event handling issues within the scrollable dialog content.

## To Reproduce
1. Navigate to '/requests' page
2. Click "New Request" button to open the request dialog
3. Try to interact with the Category select dropdown on a mobile device
4. Observe that the dropdown menu is either:
   - Unresponsive to touch
   - Opens but gets cut off
   - Doesn't position correctly relative to the trigger
   - May be obscured by other dialog content

## Expected Behavior
- Select dropdown should open smoothly on touch interaction
- Menu should position correctly relative to its trigger
- Menu should be fully visible and not cut off
- Touch interactions should work consistently
- Behavior should match desktop experience

## Technical Analysis

### Affected Components
1. `app/requests/components/request-dialog.tsx`
   - Contains the dialog implementation with the problematic select
   - Current implementation has scrollable content that may interfere with select positioning

2. `app/components/ui/select.tsx`
   - Core select component implementation
   - Uses Radix UI primitives
   - May need improved touch handling and positioning logic

3. `app/components/ui/dialog.tsx`
   - Dialog component that contains the select
   - Current max-height and overflow settings may affect select menu positioning

### Root Cause
The issue stems from:
1. Conflict between dialog's scrollable content and select menu positioning
2. Potential z-index stacking context issues
3. Possible touch event handling limitations

### Code Issues
```typescript
// In request-dialog.tsx
<DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-hidden">
  <div className="flex-1 overflow-y-auto pt-2 pb-4 px-1">
    // Select component inside scrollable container
  </div>
</DialogContent>

// In select.tsx
<SelectPrimitive.Content
  position="popper"
  // Current positioning may not account for scrollable container
>
```

## Environment
- **OS**: iOS and Android (mobile devices)
- **Browser**: Mobile Safari, Chrome Mobile
- **Version**: Latest versions
- **Screen sizes**: Various mobile viewport sizes

## Files Needing Updates

1. `app/requests/components/request-dialog.tsx`
   - Adjust dialog content structure
   - Improve select component positioning
   - Update overflow handling

2. `app/components/ui/select.tsx`
   - Enhance mobile touch handling
   - Improve positioning logic
   - Update z-index management

3. `app/components/ui/dialog.tsx`
   - Review and potentially update stacking context
   - Adjust overflow handling

4. `app/__tests__/utils/test-utils.tsx`
   - Add mobile-specific test cases
   - Include touch interaction testing

## Testing Requirements
- Add specific mobile device viewport tests
- Test touch interactions
- Verify positioning across different screen sizes
- Ensure scrolling behavior works correctly
- Validate z-index stacking

## Additional Context
- Issue appears to be specific to mobile devices
- Desktop functionality works as expected
- Problem is more pronounced on smaller viewport sizes
- May need to consider different positioning strategy for mobile vs desktop
-e \n## File: ai_docs/prompts/review/code-review.md\n
# AI Code Review Prompts

## Review Configuration

```typescript
interface CodeReviewConfig {
  type: 'feature' | 'fix' | 'refactor';
  focus: ('security' | 'performance' | 'quality' | 'testing')[];
  depth: 'basic' | 'detailed' | 'comprehensive';
}
```

## Review Prompts

### Code Quality
1. "Analyze type safety and TypeScript usage"
2. "Review component structure and modularity"
3. "Check for code duplication and reuse opportunities"
4. "Verify error handling and edge cases"

### Performance
1. "Identify potential performance bottlenecks"
2. "Review React rendering optimization"
3. "Check bundle size impact"
4. "Analyze data fetching patterns"

### Security
1. "Review authentication implementation"
2. "Check for security vulnerabilities"
3. "Verify input validation"
4. "Analyze API security"

### Testing
1. "Review test coverage and quality"
2. "Identify missing test cases"
3. "Check edge case coverage"
4. "Verify integration test scenarios"

## Review Checklist

Quality:
- [ ] Type safety verified
- [ ] Code style consistent
- [ ] Documentation complete
- [ ] Error handling robust

Performance:
- [ ] No unnecessary renders
- [ ] Optimized data fetching
- [ ] Bundle size acceptable
- [ ] Memory usage efficient

Security:
- [ ] Authentication proper
- [ ] Input validated
- [ ] XSS prevented
- [ ] CSRF protected

Testing:
- [ ] Coverage sufficient
- [ ] Edge cases tested
- [ ] Integration verified
- [ ] Performance tested
-e \n## File: ai_docs/prompts/feature/component.md\n
# Feature Component Development Prompts

## Initial Analysis

```typescript
interface ComponentAnalysis {
  type: 'atom' | 'molecule' | 'organism';
  complexity: 'simple' | 'medium' | 'complex';
  requirements: {
    props: string[];
    state: boolean;
    effects: boolean;
    children: boolean;
  };
}
```

## Development Prompts

### Structure Planning
1. "Analyze the component requirements and suggest an atomic design classification"
2. "Identify potential reusable sub-components"
3. "Determine required props and state management"

### Implementation
1. "Review the component structure for modularity"
2. "Suggest appropriate Shadcn UI components"
3. "Verify proper prop typing and validation"

### Testing
1. "Generate test cases for core functionality"
2. "Identify edge cases requiring testing"
3. "Suggest accessibility test scenarios"

## Review Checklist

- [ ] Component follows atomic design principles
- [ ] Props are properly typed
- [ ] Tests cover core functionality
- [ ] Documentation is complete
- [ ] Accessibility is implemented
- [ ] Performance is optimized
-e \n## File: ai_docs/DEVELOPER_GUIDELINES.md\n
# Teach Niche Developer Guide

## Core Philosophy

Our development approach emphasizes:
- **Modularity**: Each component and service has a single, well-defined responsibility
- **Minimalism**: Keep dependencies minimal, code simple, and interfaces clean
- **Type Safety**: Leverage TypeScript for robust, maintainable code
- **Testing First**: Write tests before implementing features

## Quick Reference

This guide provides high-level guidelines. For detailed standards, refer to:

- Component Development: [ai_docs/standards/components.md](ai_docs/standards/components.md)
- Testing Standards: [ai_docs/standards/testing.md](ai_docs/standards/testing.md)
- Git Workflow: [ai_docs/standards/git.md](ai_docs/standards/git.md)
- Security Requirements: [ai_docs/standards/security.md](ai_docs/standards/security.md)
- API Standards: [ai_docs/standards/api.md](ai_docs/standards/api.md)

 
## 1. Coding Standards

### 1.1. Language and Frameworks
- **TypeScript:** All code must be written in TypeScript for type safety
- **React:** Use functional components and hooks
- **Next.js:** Follow app router conventions
- **Shadcn UI:** Use for consistent UI components

For detailed coding standards, see [ai_docs/standards/code.md](ai_docs/standards/code.md)
 
### 1.2. Code Style
- Use ESLint and Prettier for consistent formatting
- Follow clean code principles but prioritize simplicity
- Write self-documenting code with minimal comments
- Use descriptive names in camelCase
- Avoid magic numbers with constants
- Never use "any" types

For detailed style guide, see [ai_docs/standards/style.md](ai_docs/standards/style.md)
 
### 1.3. React Guidelines
- Use functional components with hooks
- Keep components modular and focused
- Use built-in state management when possible
- Define prop types with TypeScript
- Use Tailwind CSS for styling
- Extract complex logic to custom hooks

For detailed React guidelines, see [ai_docs/standards/react.md](ai_docs/standards/react.md)
 
## 2. Component Development

For detailed component development guidelines including Atomic Design principles, Shadcn UI usage, accessibility requirements, and documentation standards, see [ai_docs/standards/components.md](ai_docs/standards/components.md)

Key principles:
- Use Atomic Design with minimalism
- Prefer Shadcn UI components
- Keep components small and focused
- Document complex components
- Ensure accessibility (WCAG)
 
## 3. Data Management

For detailed data management guidelines including Supabase setup, fetching strategies, and validation requirements, see [ai_docs/standards/data.md](ai_docs/standards/data.md)

Key principles:
- Initialize Supabase client in dedicated file
- Choose appropriate fetching strategy (SSR/CSR)
- Write efficient queries
- Validate all data with Zod
 
 
## 4. Authentication

For detailed authentication implementation guidelines including AuthContext setup, route protection, and RBAC, see [ai_docs/standards/auth.md](ai_docs/standards/auth.md)

Key principles:
- Use AuthContext provider and useAuth() hook
- Implement proper route protection
- Follow RBAC best practices
- Keep auth logic simple and consistent

Example usage:
```typescript
const { user, loading } = useAuth();
if (!user) return <SignInPage />;
```
 
## 5. External Services

### 5.1 Stripe Connect (v2025-01-27.acacia)
For detailed payment integration guidelines, see [ai_docs/standards/payments.md](ai_docs/standards/payments.md)

Key principles:
- Use pre-built Stripe components
- Handle webhooks in Edge Functions
- Implement proper error handling
- Enable creator payouts

### 5.2 Mux Video
For detailed video handling guidelines, see [ai_docs/standards/video.md](ai_docs/standards/video.md)

Key principles:
- Follow SDK best practices
- Handle upload/playback errors
- Implement proper analytics
 
 
 
## 6. Environment & Deployment

### 6.1 Environment Variables
For detailed environment configuration guidelines, see [ai_docs/standards/env.md](ai_docs/standards/env.md)

Key principles:
- Use .env for local development
- Configure in Vercel for production
- Provide .env.template
 
## 7. Testing

For detailed testing guidelines including organization, utilities, structure, and best practices, see [ai_docs/standards/testing.md](ai_docs/standards/testing.md)

Key principles:
- Place tests in `__tests__` directories
- Use provided testing utilities
- Follow standard test structure
- Maintain 80% coverage minimum
- Include accessibility testing
- Run tests in CI pipeline

Example test structure:
```typescript
describe('ComponentName', () => {
  it('renders and behaves as expected', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```
 
## 8. Security & Error Handling

For detailed security guidelines and error handling strategies, see [ai_docs/standards/security.md](ai_docs/standards/security.md)

Key principles:
- Validate all inputs with Zod
- Protect API routes with auth middleware
- Use Error Boundaries for UI errors
- Implement structured error logging

## 9. Performance

For detailed performance optimization guidelines, see [ai_docs/standards/performance.md](ai_docs/standards/performance.md)

Key principles:
- Use route-based code splitting
- Optimize images with Next/Image
- Monitor Core Web Vitals
- Run bundle analysis in CI
 
## 10. Documentation

For detailed documentation standards, see [ai_docs/standards/docs.md](ai_docs/standards/docs.md)

Key principles:
- Write clear, minimal code comments
- Maintain comprehensive README.md
- Keep ai_docs/ focused and up-to-date
 
 
 ## Architecture
 
### Project Structure

The project follows Next.js 13+ app router conventions with a clear separation of concerns:

```
/app
├── api/                  # API route handlers
│   ├── checkout/        # Payment/checkout endpoints
│   ├── lessons/         # Lesson management
│   ├── mux/            # Video service integration
│   ├── requests/       # Lesson requests
│   ├── stripe/         # Payment processing
│   ├── video/          # Video handling
│   └── webhooks/       # External service webhooks
├── components/          # Shared components
│   ├── providers.tsx   # App-wide providers
│   └── ui/             # Reusable UI components
│       └── __tests__/  # Component tests
├── dashboard/          # Dashboard feature
│   ├── components/     # Dashboard-specific components
│   └── page.tsx       # Dashboard page
├── lessons/           # Lesson management
│   ├── [id]/         # Individual lesson pages
│   ├── new/          # New lesson creation
│   └── page.tsx      # Lessons list page
├── lib/              # Shared utilities
│   ├── schemas/      # Data validation schemas
│   ├── supabase/    # Database utilities
│   └── utils.ts     # General utilities
├── profile/         # User profile feature
│   ├── components/  # Profile-specific components
│   └── page.tsx    # Profile page
├── requests/        # Lesson requests feature
│   ├── components/  # Request-specific components
│   │   └── __tests__/ # Request component tests
│   └── page.tsx    # Requests page
└── services/       # External service integrations
    ├── auth/       # Authentication
    ├── mux.ts      # Video service
    ├── stripe.ts   # Payment processing
    └── supabase.ts # Database client
```

Key organizational principles:

1. **Feature-based Organization**
   - Major features have dedicated directories (dashboard, lessons, profile, requests)
   - Each feature directory contains its specific components and pages

2. **Component Organization**
   - Shared UI components in /components/ui
   - Feature-specific components co-located with their features
   - Tests co-located with components in __tests__ directories

3. **API Routes**
   - Grouped by feature/service
   - Clear separation of concerns (auth, video, payments, etc.)
   - Webhook handlers isolated in /api/webhooks

4. **Services & Utilities**
   - External service integrations in /services
   - Shared utilities and schemas in /lib
   - Database utilities separated in /lib/supabase

5. **Testing Structure**
   - Tests co-located with components
   - Consistent naming convention (*.test.tsx)
   - Shared test utilities in project root /__mocks__

This structure promotes:
- Clear separation of concerns
- Easy feature location and navigation
- Scalable organization for new features
- Consistent testing approach
- Modular component development

## 11. Version Control

For detailed Git workflow guidelines including branching strategy, protection rules, and merging practices, see [ai_docs/standards/git.md](ai_docs/standards/git.md)


Key principles:
- Follow trunk-based development
- Use feature branches for changes
- Require PR reviews
- Keep branches short-lived
 
 ## Deployment
 
 - Preview deployments for all PRs
 - Production deploys require approval
 - Environment variables managed in Vercel
 - Zero-downtime deployments
 - Automated rollbacks on failure
 
 By adhering to these guidelines, with a strong focus on **modularity and minimalism**, we can ensure a consistent, maintainable, and high-quality codebase for the Teach Niche project.  These guidelines are living documents and should be updated as the project evolves and new best practices emerge, always keeping modularity and minimalism in mind.````
-e \n## File: ai_docs/CORE.md\n
# Core Development System

This document defines the core types and interfaces for our adaptive development system. It serves as the single source of truth for workflow configurations and quality standards.

## Core Types

```typescript
/**
 * Primary configuration interface for all workflow changes
 */
interface WorkflowConfig {
  // Type of change being made
  changeType: 'feature' | 'fix' | 'docs' | 'refactor';
  
  // Complexity level of the change
  complexity: 'simple' | 'medium' | 'complex';
  
  // Urgency level for processing
  urgency: 'normal' | 'urgent';
  
  // Scope of the change
  scope: {
    // System areas affected by the change
    affects: ('ui' | 'api' | 'db' | 'auth' | 'payment' | 'video')[];
    
    // Required testing levels
    testingRequired: ('unit' | 'integration' | 'e2e' | 'performance' | 'accessibility')[];
  };
}

/**
 * Testing configuration and requirements
 */
interface TestingConfig {
  testTypes: ('unit' | 'integration' | 'e2e' | 'accessibility')[];
  coverageThresholds: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  location: string;
  utilities: {
    render: string;
    mocks: string;
  };
}

/**
 * Component configuration following Atomic Design
 */
interface ComponentConfig {
  type: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  useShadcn: boolean;
  requiresAuth?: boolean;
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    ariaRequired: boolean;
  };
}

/**
 * Quality gate definition for workflow stages
 */
interface QualityGate {
  // Gate identifier
  name: string;
  
  // Required checks for this gate
  checks: string[];
  
  // Pass/fail threshold (0-100)
  threshold: number;
  
  // Whether failing this gate blocks progression
  blocking: boolean;
}

/**
 * Branch progression definition
 */
interface WorkflowStage {
  // Branch name
  branch: string;
  
  // Required quality gates
  gates: QualityGate[];
  
  // Next possible stages
  nextStages: string[];
  
  // Whether human review is required
  requiresReview: boolean;
}
```

## Core Functions

```typescript
/**
 * Determines the workflow path based on configuration
 */
function determineWorkflowPath(config: WorkflowConfig): string[] {
  if (config.urgency === 'urgent' && config.changeType === 'fix') {
    return ['hotfix', 'main'];  // Emergency path
  }
  
  if (config.complexity === 'simple' && config.scope.affects.includes('ui')) {
    return ['feature', 'dev', 'main'];  // Skip staging for simple UI
  }
  
  return ['feature', 'dev', 'staging', 'main'];  // Full path
}

/**
 * Gets required quality gates for a stage
 */
function getQualityGates(stage: string, config: WorkflowConfig): QualityGate[] {
  // Implementation defined in checks/quality-gates.md
  return [];
}

/**
 * Determines automation level for a change
 */
function getAutomationLevel(config: WorkflowConfig): 'full' | 'assisted' | 'manual' {
  if (config.complexity === 'simple' && config.changeType !== 'fix') {
    return 'full';
  }
  
  if (config.urgency === 'urgent' || config.complexity === 'complex') {
    return 'manual';
  }
  
  return 'assisted';
}
```

## Technology Stack Requirements

1. TypeScript Standards
- Strict TypeScript configuration
- No 'any' types allowed
- All props and returns explicitly typed
- No type assertions without validation
- Use TypeScript for enhanced code maintainability

2. React & Next.js
- Functional components with hooks
- Next.js app router conventions
- Server-side rendering optimization
- API routes following Next.js patterns
- Clean code principles and SOLID

3. Shadcn UI Implementation
- Use Shadcn UI components by default
- Consistent component customization
- Maintain design system integrity
- Minimal custom component creation

4. Supabase Integration
- Typed database interactions
- Secure authentication flows
- Real-time subscriptions when needed
- Efficient query patterns

## Quality Standards

1. Type Safety
- No use of 'any' types
- All props and returns typed
- No type assertions without validation
- Interface-first development

2. Testing
- Unit tests for all new code
- Integration tests for API changes
- E2E tests for user flows
- Coverage requirements per complexity:
  - Simple: 80%
  - Medium: 90%
  - Complex: 100%
- Tests co-located with source files
- Use provided test utilities

3. Documentation
- JSDoc for exported functions
- README updates for features
- API documentation for endpoints
- Change documentation in commits
- Component usage examples

4. Performance
- No unnecessary re-renders
- Optimized data fetching
- Bundle size monitoring
- Performance testing for complex changes
- Core Web Vitals optimization

5. Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA attributes where needed
- Keyboard navigation support
- Screen reader testing

6. Security
- Input validation with Zod
- XSS prevention
- CSRF protection
- Secure authentication flows
- API route protection

## Directory Structure

```
ai_docs/
├── CORE.md              # This file
├── workflows/           # Workflow definitions
│   ├── feature.md      # Feature development
│   ├── fix.md          # Bug fixes
│   ├── docs.md         # Documentation
│   └── refactor.md     # Refactoring
├── checks/             # Quality checks
│   ├── typescript.md   # Type checking
│   ├── testing.md      # Testing
│   ├── security.md     # Security
│   └── performance.md  # Performance
├── standards/          # Implementation standards
│   ├── components.md   # Component standards
│   ├── testing.md      # Testing standards
│   ├── security.md     # Security standards
│   └── api.md          # API standards
└── prompts/           # AI guidance
    ├── feature/       # Feature prompts
    ├── fix/           # Fix prompts
    └── review/        # Review prompts
```

## Service Integration

### Supabase Integration
- Initialize client in dedicated file
- Type-safe database operations
- Real-time subscription patterns
- Secure authentication flows
- Row Level Security implementation

### Stripe Connect
- Version: 2025-01-27.acacia
- Secure payment processing
- Webhook handling in Edge Functions
- Connect account management
- Payout system integration

### Mux Video
- Video upload optimization
- Streaming implementation
- Analytics integration
- Error handling patterns
- Playback optimization

### Authentication
- Supabase Auth implementation
- Protected route patterns
- Role-based access control
- Session management
- Security best practices

## Workflow Progression

Changes follow this general progression:

1. Initial Configuration
- Determine change type
- Assess complexity
- Define scope
- Set urgency

2. Path Determination
- Calculate workflow path
- Identify quality gates
- Set automation level

3. Stage Progression
- Meet quality gates
- Pass reviews if required
- Automated testing
- Documentation updates

4. Completion
- Final quality checks
- Merge approval
- Deployment
- Monitoring

Each stage's specific requirements are defined in the respective workflow documents.
-e \n## File: ai_docs/EXTERNAL_RESOURCES.md\n
Mux SDK:

https://github.com/muxinc/mux-node-sdk/blob/master/api.md

-e \n## File: ai_docs/standards/api.md\n
# API Development Standards

## API Structure

### Route Organization
```
app/api/
├── checkout/         # Payment/checkout endpoints
├── lessons/         # Lesson management
├── mux/            # Video service integration
├── requests/       # Lesson requests
├── stripe/         # Payment processing
├── video/          # Video handling
└── webhooks/       # External service webhooks
```

### 2. Response Format
```typescript
interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
}

interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp: string;
}

type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_ERROR'
  | 'INTERNAL_ERROR';
```

## Implementation Guidelines

### 1. Route Handler Structure
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) {
  try {
    // 1. Validate request
    const data = await validateRequest(req);
    
    // 2. Check authentication
    const session = await getSession(req);
    
    // 3. Process request
    const result = await processRequest(data);
    
    // 4. Return response
    return res.status(200).json({
      data: result
    });
  } catch (error) {
    handleApiError(error, res);
  }
}
```

### 2. Error Handling
```typescript
function handleApiError(
  error: unknown,
  res: NextApiResponse,
  context?: Record<string, unknown>
) {
  logger.error('API error:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    context,
    timestamp: new Date().toISOString()
  });

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.details
      }
    });
  }
  
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: generateRequestId()
    }
  });
}
```

## Authentication & Authorization

### 1. Authentication
- Supabase session validation
- JWT token verification
- API key validation
- Rate limiting

### 2. Authorization
- Role-based access
- Resource ownership
- Permission checks
- Audit logging

## Data Validation

### 1. Request Validation
```typescript
import { z } from 'zod';

const requestSchema = z.object({
  // Define schema
});

async function validateRequest(req: NextApiRequest) {
  return requestSchema.parse(req.body);
}
```

### 2. Response Validation
```typescript
const responseSchema = z.object({
  // Define schema
});

function validateResponse(data: unknown) {
  return responseSchema.parse(data);
}
```

## Testing

### 1. Unit Tests
```typescript
describe('API Handler', () => {
  it('handles valid requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { /* test data */ }
    });
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### 2. Integration Tests
```typescript
describe('API Integration', () => {
  it('integrates with database', async () => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ /* test data */ })
    });
    
    expect(response.status).toBe(200);
  });
});
```

## Performance

### 1. Optimization
- Query optimization
- Response caching
- Pagination
- Rate limiting
- Error handling

### 2. Monitoring
- Response times
- Error rates
- Usage metrics
- Cache hits
- Database load

## Documentation

### 1. API Documentation
```typescript
/**
 * @api {post} /api/endpoint Endpoint Name
 * @apiGroup Group
 * @apiVersion 1.0.0
 *
 * @apiParam {String} param Parameter description
 *
 * @apiSuccess {Object} data Success response
 * @apiError {Object} error Error response
 */
```

### 2. Type Documentation
```typescript
/**
 * Request data interface
 */
interface RequestData {
  /** Parameter description */
  param: string;
}
```

## Security

### 1. Input Validation
- Validate all inputs
- Sanitize data
- Type checking
- Size limits

### 2. Output Security
- Sanitize responses
- Remove sensitive data
- Rate limiting
- Error handling

## Version Control

### 1. API Versioning
- URL versioning (/api/v1/)
- Header versioning
- Documentation
- Deprecation notices

### 2. Change Management
- Breaking changes
- Backward compatibility
- Migration guides
- Version lifecycle
-e \n## File: ai_docs/standards/video.md\n
# Video Integration Standards

## Mux Integration

### Configuration
```typescript
// services/mux.ts
import Mux from '@mux/mux-node'

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})
```

### Upload Handling
```typescript
interface UploadOptions {
  maxSizeMB?: number
  acceptedTypes?: string[]
  onProgress?: (progress: number) => void
  onComplete?: (assetId: string) => void
  onError?: (error: Error) => void
}

export function VideoUploader({
  maxSizeMB = 500,
  acceptedTypes = ['video/mp4', 'video/quicktime'],
  onProgress,
  onComplete,
  onError
}: UploadOptions) {
  return (
    <MuxUploader
      endpoint="/api/mux/upload-url"
      onUploadProgress={onProgress}
      onSuccess={onComplete}
      onError={onError}
    />
  )
}
```

### Playback Configuration
```typescript
interface PlaybackConfig {
  playbackId: string
  title: string
  poster?: string
  startTime?: number
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
}

export function VideoPlayer({
  playbackId,
  title,
  ...config
}: PlaybackConfig) {
  return (
    <MuxPlayer
      streamType="on-demand"
      playbackId={playbackId}
      metadata={{ video_title: title }}
      {...config}
    />
  )
}
```

## Video Processing

### Asset Management
```typescript
async function createVideoAsset(uploadId: string) {
  const asset = await mux.video.assets.create({
    input: [{
      url: `https://storage.muxcdn.com/${uploadId}`,
    }],
    playback_policy: ['public'],
    test: process.env.NODE_ENV !== 'production'
  })
  
  return asset
}
```

### Status Tracking
```typescript
type VideoStatus = 'preparing' | 'ready' | 'errored'

function useVideoStatus(assetId: string) {
  const [status, setStatus] = useState<VideoStatus>('preparing')
  
  useEffect(() => {
    const checkStatus = async () => {
      const asset = await mux.video.assets.get(assetId)
      setStatus(asset.status)
    }
    
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [assetId])
  
  return status
}
```

## Analytics

### View Tracking
```typescript
function VideoAnalytics({ assetId }: { assetId: string }) {
  useEffect(() => {
    const monitor = muxjs.monitor('#video-player', {
      data: {
        env_key: process.env.NEXT_PUBLIC_MUX_ENV_KEY,
        video_id: assetId,
        video_title: title,
        viewer_user_id: userId
      }
    })

    return () => monitor.destroy()
  }, [assetId])
}
```

### Performance Monitoring
```typescript
interface VideoMetrics {
  playbackSuccess: number
  rebufferCount: number
  startupTime: number
  videoStartFailure: number
}

function trackVideoMetrics(metrics: VideoMetrics) {
  analytics.track('video_playback', {
    ...metrics,
    timestamp: new Date().toISOString()
  })
}
```

## Error Handling

### Upload Errors
```typescript
async function handleUploadError(error: Error, context?: Record<string, unknown>) {
  logger.error('Video upload failed:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    context,
    timestamp: new Date().toISOString()
  })
  
  // Notify user
  toast.error('Failed to upload video. Please try again.')
}
```

### Playback Errors
```typescript
function handlePlaybackError(error: Error, context?: Record<string, unknown>) {
  logger.error('Video playback failed:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    context,
    timestamp: new Date().toISOString()
  })
  
  // Show fallback content
  return (
    <div className="video-error">
      <p>Unable to play video. Please try again later.</p>
    </div>
  )
}
```

## Testing

### Mock Video Player
```typescript
function MockVideoPlayer({ playbackId }: { playbackId: string }) {
  return (
    <div data-testid="mock-video-player">
      <p>Mock Video Player: {playbackId}</p>
    </div>
  )
}

// In tests
jest.mock('@/components/VideoPlayer', () => MockVideoPlayer)
```

### Upload Testing
```typescript
describe('VideoUploader', () => {
  it('handles successful upload', async () => {
    const onComplete = jest.fn()
    render(<VideoUploader onComplete={onComplete} />)
    
    // Simulate upload
    await uploadTestFile('test-video.mp4')
    
    expect(onComplete).toHaveBeenCalledWith(expect.any(String))
  })
})
```

## Security

### Access Control
- Implement signed URLs for private videos
- Use secure tokens for playback
- Validate upload permissions
- Monitor for abuse

### Content Protection
- Enable DRM when needed
- Implement watermarking
- Use signed playback tokens
- Monitor for piracy

## Performance

### Optimization
- Use adaptive bitrate streaming
- Enable lazy loading
- Implement proper caching
- Monitor bandwidth usage

### Best Practices
- Compress videos appropriately
- Use thumbnail previews
- Implement proper preloading
- Monitor viewer experience

## Documentation

### Integration Guide
- Setup instructions
- API reference
- Common issues
- Best practices

### Monitoring Guide
- Performance metrics
- Error tracking
- Usage analytics
- Cost optimization
-e \n## File: ai_docs/standards/data.md\n
# Data Management Standards

## Supabase Integration

### Client Setup
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Data Fetching Strategies

#### Server Components
```typescript
// Preferred for static/dynamic pages
async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await fetchLesson(params.id)
  return <LessonDetail lesson={lesson} />
}
```

#### Client Components
```typescript
// For real-time or interactive features
function LessonComments({ lessonId }: { lessonId: string }) {
  const { data, error } = useQuery(['comments', lessonId], 
    () => fetchComments(lessonId)
  )
}
```

### Data Validation

#### Schema Definition
```typescript
import { z } from 'zod'

export const lessonSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  price: z.number().min(0),
  // ...
})

export type Lesson = z.infer<typeof lessonSchema>
```

#### Input Validation
```typescript
async function createLesson(input: unknown) {
  const data = lessonSchema.parse(input)
  // Proceed with validated data
}
```

### Query Optimization

#### Efficient Queries
```typescript
// Good: Specific column selection
const { data } = await supabase
  .from('lessons')
  .select('id, title, description')
  .eq('user_id', userId)

// Avoid: Selecting all columns
const { data } = await supabase
  .from('lessons')
  .select('*')
```

#### Pagination
```typescript
const ITEMS_PER_PAGE = 10

async function fetchLessons(page: number) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .range(
      page * ITEMS_PER_PAGE,
      (page + 1) * ITEMS_PER_PAGE - 1
    )
}
```

### Error Handling

#### Database Errors
```typescript
try {
  const { data, error } = await supabase.from('lessons').insert(lesson)
  if (error) throw error
  return data
} catch (error) {
  logger.error('Database error:', error)
  throw new Error('Failed to create lesson')
}
```

### Real-time Subscriptions

#### Setup
```typescript
function useRealtimeData(tableName: string, conditions: object) {
  useEffect(() => {
    const subscription = supabase
      .from(tableName)
      .on('*', (payload) => {
        // Handle changes
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tableName, conditions])
}
```

## Data Access Patterns

### Repository Pattern
```typescript
class LessonRepository {
  async findById(id: string): Promise<Lesson> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(lesson: Lesson): Promise<void> {
    const { error } = await supabase
      .from('lessons')
      .insert(lesson)

    if (error) throw error
  }
}
```

### Data Transformation

#### DTOs (Data Transfer Objects)
```typescript
interface LessonDTO {
  id: string
  title: string
  description: string
  price: number
  created_at: string
}

function transformLesson(dto: LessonDTO): Lesson {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    price: dto.price,
    createdAt: new Date(dto.created_at)
  }
}
```

## Security

### Data Access Control
- Implement Row Level Security (RLS)
- Use appropriate policies
- Validate user permissions

### SQL Injection Prevention
- Use parameterized queries
- Never concatenate SQL strings
- Validate and sanitize inputs

## Testing

### Database Testing
```typescript
describe('LessonRepository', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDb()
  })

  it('creates a lesson', async () => {
    const repo = new LessonRepository()
    const lesson = createTestLesson()
    await repo.create(lesson)
    const saved = await repo.findById(lesson.id)
    expect(saved).toEqual(lesson)
  })
})
```

## Performance

### Caching Strategy
```typescript
const lessonCache = new Map<string, Lesson>()

async function getCachedLesson(id: string): Promise<Lesson> {
  if (lessonCache.has(id)) {
    return lessonCache.get(id)!
  }

  const lesson = await fetchLesson(id)
  lessonCache.set(id, lesson)
  return lesson
}
```

### Query Performance
- Use appropriate indexes
- Monitor query performance
- Optimize slow queries
- Use connection pooling

## Migrations

### Structure
```sql
-- migrations/001_create_lessons.sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes
create index lessons_user_id_idx on lessons(user_id);
```

### Version Control
- Track all migrations
- Use sequential numbering
- Include rollback scripts
- Test migrations

## Monitoring

### Error Tracking
```typescript
function logDatabaseError(error: Error, context?: Record<string, unknown>) {
  logger.error('Database error:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
}
```

### Performance Monitoring
- Track query times
- Monitor connection pool
- Set up alerts
- Regular maintenance
-e \n## File: ai_docs/standards/components.md\n
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
-e \n## File: ai_docs/standards/testing.md\n
# Testing Standards

## Test Organization

### Directory Structure
```
app/
├── __tests__/           # App-wide tests
├── components/
│   └── ui/
│       └── __tests__/  # Component tests
└── features/
    └── __tests__/      # Feature tests
```

### File Naming
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## Test Types

### 1. Unit Tests
- Test individual functions/components
- Mock external dependencies
- Fast execution
- High coverage

### 2. Integration Tests
- Test component interactions
- Test API integrations
- Limited mocking
- Real database connections

### 3. E2E Tests
- Test complete user flows
- Real browser environment
- No mocking
- Production-like data

### 4. Accessibility Tests
- WCAG compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast

## Coverage Requirements

### Minimum Coverage
```typescript
const coverageThresholds = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
  
  // Critical paths
  critical: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100
  }
};
```

## Testing Utilities

### 1. Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Example test
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### 2. API Testing
```typescript
import { createMocks } from 'node-mocks-http';

describe('API', () => {
  it('handles successful requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { data: 'test' }
    });
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });

  it('handles errors appropriately', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { data: 'invalid' }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        code: expect.any(String),
        message: expect.any(String)
      }
    });
  });
});
```

## Best Practices

### 1. Test Structure
- Arrange: Set up test data
- Act: Execute test action
- Assert: Verify results

### 2. Naming Conventions
```typescript
describe('ComponentName', () => {
  describe('behavior', () => {
    it('should do something when condition', () => {
      // Test
    });
  });
});
```

### 3. Mocking
- Mock external services
- Use consistent mock data
- Reset mocks between tests
- Document mock behavior

### 4. Error Testing
- Test error conditions
- Verify error handling
- Test edge cases
- Test validation

## Quality Gates

### Development Gate
- All unit tests pass
- Coverage meets thresholds
- No TypeScript errors
- Linting passes

### Integration Gate
- Integration tests pass
- E2E critical paths pass
- Performance metrics met
- Security checks pass

### Production Gate
- All tests pass
- Full E2E suite passes
- Load testing passes
- Security scan clean

## Continuous Integration

### GitHub Actions
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Documentation

### Test Documentation
- Purpose of test suite
- Setup requirements
- Test data explanation
- Mock configuration
- Common patterns

### Coverage Reports
- Generate HTML reports
- Track trends over time
- Identify gaps
- Set improvement goals
-e \n## File: ai_docs/standards/performance.md\n
# Performance Standards

## Core Web Vitals

### Metrics Monitoring
```typescript
// lib/monitoring/web-vitals.ts
import { onCLS, onFID, onLCP } from 'web-vitals'

function sendToAnalytics(metric: any) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname,
  }
  
  navigator.sendBeacon('/api/metrics', JSON.stringify(body))
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onLCP(sendToAnalytics)
}
```

### Performance Goals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.8s
- TBT (Total Blocking Time): < 200ms

## Image Optimization

### Next.js Image Component
```typescript
import Image from 'next/image'

function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL={getBlurDataUrl(src)}
      priority={isPriority(src)}
    />
  )
}
```

### Image Loading Strategy
- Use appropriate sizes
- Enable lazy loading
- Implement blur placeholder
- Prioritize above-fold images
- Use modern formats (WebP)

## Code Splitting

### Dynamic Imports
```typescript
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  loading: () => <VideoPlayerSkeleton />,
  ssr: false
})
```

### Route-Based Splitting
- Leverage Next.js automatic code splitting
- Use dynamic imports for large components
- Implement proper loading states
- Monitor chunk sizes

## Caching Strategy

### Browser Caching
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

### API Response Caching
```typescript
export async function GET() {
  const cacheKey = 'lessons:featured'
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    })
  }
  
  const data = await getFeaturedLessons()
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 60)
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}
```

## Bundle Optimization

### Bundle Analysis
```bash
# package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### Size Monitoring
- Track bundle sizes in CI
- Set size limits
- Monitor dependencies
- Remove unused code

## Database Performance

### Query Optimization
- Use appropriate indexes
- Optimize joins
- Implement caching
- Monitor query times

### Connection Management
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

## Client-Side Performance

### React Optimization
```typescript
// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => b.price - a.price)
}, [items])

// Memoize callbacks
const handleSubmit = useCallback(() => {
  // Handle submission
}, [dependencies])

// Memoize components
const MemoizedComponent = memo(Component)
```

### State Management
- Use appropriate state solutions
- Implement proper memoization
- Monitor re-renders
- Optimize context usage

## Testing

### Performance Testing
```typescript
describe('Performance', () => {
  it('renders list within performance budget', async () => {
    const startTime = performance.now()
    render(<LargeList items={items} />)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(100)
  })
})
```

### Load Testing
```typescript
import { check } from 'k6/http'

export default function() {
  const res = http.get('https://api.example.com/lessons')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  })
}
```

## Monitoring

### Performance Monitoring
```typescript
function trackPerformanceMetric(
  name: string,
  value: number,
  tags: Record<string, string>
) {
  analytics.track('performance_metric', {
    name,
    value,
    ...tags,
    timestamp: new Date().toISOString()
  })
}
```

### Error Tracking
```typescript
function trackPerformanceError(error: Error, context?: Record<string, unknown>) {
  logger.error('Performance error:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
}
```

## Best Practices

### Loading States
- Implement proper skeletons
- Show progress indicators
- Handle timeout errors
- Provide feedback

### Error Boundaries
```typescript
class PerformanceErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    trackPerformanceError(error, info)
  }
  
  render() {
    return this.props.children
  }
}
```

### Resource Hints
```html
<link rel="preconnect" href="https://api.example.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
```

### Performance Checklist
- Optimize images
- Minimize JavaScript
- Enable compression
- Use CDN
- Implement caching
- Monitor metrics
- Test performance
- Handle errors
-e \n## File: ai_docs/standards/env.md\n
# Environment Configuration Standards

## Environment Variables

### Required Variables
```bash
# Authentication
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Mux
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
NEXT_PUBLIC_MUX_ENV_KEY=your-env-key

# General
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=development
```

### Configuration Management
```typescript
// lib/config.ts
import { z } from 'zod'

const envSchema = z.object({
  // Auth
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  
  // Mux
  MUX_TOKEN_ID: z.string().min(1),
  MUX_TOKEN_SECRET: z.string().min(1),
  NEXT_PUBLIC_MUX_ENV_KEY: z.string().min(1),
  
  // App
  NEXT_PUBLIC_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

export type Env = z.infer<typeof envSchema>;

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    )
    throw new Error('Invalid environment variables')
  }
}
```

## Development Setup

### Local Environment
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
# ... other variables
```

### Test Environment
```bash
# .env.test
NODE_ENV=test
NEXT_PUBLIC_URL=http://localhost:3000
# Use test API keys
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_URL=https://your-domain.com
# Use production API keys
```

## Environment Templates

### Template File
```bash
# .env.template
# Authentication
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Configuration
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Mux Video
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
NEXT_PUBLIC_MUX_ENV_KEY=

# Application
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=development
```

## Security

### Environment Protection
- Never commit .env files
- Use .gitignore properly
- Rotate secrets regularly
- Use environment-specific keys

### Access Control
- Limit access to production secrets
- Use secret rotation
- Implement proper logging
- Monitor for exposure

## Deployment

### Vercel Configuration
- Set environment variables in Vercel dashboard
- Use preview environment variables
- Enable branch-specific variables
- Monitor variable usage

### CI/CD Setup
- Set CI/CD environment variables
- Use GitHub secrets
- Implement proper validation
- Monitor deployments

## Testing

### Environment Setup
```typescript
// setup-test-env.ts
import { loadEnvConfig } from '@next/env'

export default async function setupTestEnv() {
  const projectDir = process.cwd()
  loadEnvConfig(projectDir)
}
```

### Test Configuration
```typescript
describe('Environment', () => {
  it('validates required variables', () => {
    expect(() => validateEnv()).not.toThrow()
  })
})
```

## Documentation

### Setup Guide
1. Copy .env.template to .env.local
2. Fill in required variables
3. Validate configuration
4. Start development server

### Troubleshooting
- Common issues
- Variable validation
- Missing variables
- Invalid formats

## Monitoring

### Environment Checks
```typescript
function checkEnvironment() {
  // Validate required variables
  validateEnv()
  
  // Check API connections
  checkSupabaseConnection()
  checkStripeConnection()
  checkMuxConnection()
  
  console.log('✅ Environment validated')
}
```

### Error Tracking
```typescript
function logEnvironmentError(error: Error, context?: Record<string, unknown>) {
  logger.error('Environment error:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    context,
    timestamp: new Date().toISOString()
  })
}
```
-e \n## File: ai_docs/standards/payments.md\n
# Payment Integration Standards

## Stripe Setup

### Configuration
```typescript
// services/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
```

### Connect Account Setup
```typescript
async function createConnectAccount(userId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      userId,
    },
  })
  
  return account
}
```

## Payment Processing

### Checkout Session
```typescript
async function createCheckoutSession(lessonId: string, userId: string) {
  const lesson = await getLessonDetails(lessonId)
  
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: lesson.title,
        },
        unit_amount: lesson.price * 100,
      },
      quantity: 1,
    }],
    metadata: {
      lessonId,
      userId,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/lessons/${lessonId}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/lessons/${lessonId}?canceled=true`,
  })
}
```

### Webhook Handling
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event.data.object)
        break
      case 'account.updated':
        await handleConnectAccountUpdate(event.data.object)
        break
      // Handle other events...
    }
    
    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      'Webhook error: ' + (error as Error).message,
      { status: 400 }
    )
  }
}
```

## Creator Payouts

### Transfer Configuration
```typescript
async function createTransfer(
  amount: number,
  destinationAccount: string,
  paymentIntent: string
) {
  return stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: destinationAccount,
    transfer_group: paymentIntent,
  })
}
```

### Platform Fee Calculation
```typescript
function calculatePlatformFee(amount: number): {
  platformFee: number,
  creatorPayout: number
} {
  const platformFeePercentage = 0.10 // 10%
  const platformFee = Math.round(amount * platformFeePercentage)
  const creatorPayout = amount - platformFee
  
  return {
    platformFee,
    creatorPayout,
  }
}
```

## Error Handling

### Payment Errors
```typescript
async function handlePaymentError(error: Stripe.StripeError) {
  switch (error.type) {
    case 'StripeCardError':
      throw new Error('Your card was declined.')
    case 'StripeInvalidRequestError':
      throw new Error('Invalid payment request.')
    case 'StripeConnectionError':
      throw new Error('Network error. Please try again.')
    default:
      throw new Error('An unexpected error occurred.')
  }
}
```

### Refund Processing
```typescript
async function processRefund(
  paymentIntentId: string,
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent'
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
    })
    
    await updateOrderStatus(refund.payment_intent, 'refunded')
    return refund
  } catch (error) {
    logger.error('Refund failed:', error)
    throw new Error('Failed to process refund')
  }
}
```

## Testing

### Test Mode
```typescript
const testStripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
```

### Test Cards
```typescript
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  expired: '4000000000000069',
}
```

### Webhook Testing
```typescript
describe('Stripe Webhooks', () => {
  it('handles successful payment', async () => {
    const event = createTestEvent('checkout.session.completed')
    const response = await handleWebhook(event)
    expect(response.status).toBe(200)
  })
})
```

## Security

### Data Handling
- Never log full card details
- Encrypt sensitive data
- Use webhook signatures
- Validate all inputs

### PCI Compliance
- Use Stripe Elements
- Never handle raw card data
- Follow security guidelines
- Regular security audits

## Monitoring

### Payment Monitoring
```typescript
function logPaymentEvent(
  type: 'success' | 'failure' | 'refund',
  data: object
) {
  logger.info('Payment event:', {
    type,
    timestamp: new Date().toISOString(),
    ...data,
  })
}
```

### Error Tracking
```typescript
function trackStripeError(error: Stripe.StripeError) {
  logger.error('Stripe error:', {
    type: error.type,
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
  })
}
```
-e \n## File: ai_docs/standards/style.md\n
# Style Guide

## Code Formatting

### TypeScript/JavaScript
```typescript
// Right way
function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}

// Wrong way
function calculateTotal( items:Item[] ){
  return items.reduce((total,item)=>{return total+item.price},0)
}
```

### React Components
```typescript
// Right way
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="user-profile">
      {/* Component content */}
    </div>
  );
}

// Wrong way
export function UserProfile(props) {
  var editing = false
  return (<div className='user-profile'>{/* Content */}</div>)
}
```

## Naming Conventions

### Components
```typescript
// Right
export function UserProfile() {}
export function AuthenticationModal() {}

// Wrong
export function userProfile() {}
export function auth_modal() {}
```

### Variables
```typescript
// Right
const userCount = 0;
const isLoading = false;
const MAX_RETRIES = 3;

// Wrong
const UsErCoUnT = 0;
const loading = false;
const maxRetries = 3;
```

### Functions
```typescript
// Right
function handleSubmit() {}
function validateEmail() {}

// Wrong
function submit() {}
function emailvalidator() {}
```

## File Organization

### Directory Structure
```
src/
├── components/
│   ├── common/
│   └── features/
├── hooks/
├── utils/
└── types/
```

### Import Order
```typescript
// 1. React and external libraries
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal components
import { Button } from '@/components/ui';

// 3. Types and utilities
import type { User } from '@/types';
import { formatDate } from '@/utils';

// 4. Styles
import './styles.css';
```

## CSS/Tailwind

### Class Organization
```html
<!-- Right -->
<div
  className={cn(
    "flex items-center",
    "p-4 rounded-lg",
    "bg-white dark:bg-gray-800",
    className
  )}
>

<!-- Wrong -->
<div className="flex items-center p-4 rounded-lg bg-white dark:bg-gray-800">
```

### Custom Classes
```css
/* Right */
.user-profile {
  @apply flex items-center gap-4 p-4;
}

/* Wrong */
.UserProfile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
```

## Comments

### Component Documentation
```typescript
/**
 * UserProfile displays user information and handles profile updates
 *
 * @param user - The user object containing profile data
 * @param onUpdate - Callback function when profile is updated
 */
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  // Implementation
}
```

### Code Comments
```typescript
// Right
// Calculate total with tax and shipping
const total = subtotal * TAX_RATE + SHIPPING_COST;

// Wrong
// Calculate
const t = s * 1.2 + 10;
```

## Error Handling

### Error Messages
```typescript
// Right
throw new Error('Failed to load user profile: Invalid ID');

// Wrong
throw new Error('error!!!');
```

### Try/Catch Blocks
```typescript
// Right
try {
  await saveUserData(userData);
} catch (error) {
  logger.error('Failed to save user data:', error);
  throw new Error('Unable to save user data');
}

// Wrong
try {
  await saveUserData(userData);
} catch (e) {
  console.log(e);
}
```

## Testing

### Test Organization
```typescript
// Right
describe('UserProfile', () => {
  it('displays user information correctly', () => {
    // Test implementation
  });
});

// Wrong
test('it works', () => {
  // Test implementation
});
```

## Version Control

### Commit Messages
```
// Right
feat(auth): implement OAuth login with Google

// Wrong
fixed stuff
```

## Documentation

### README
- Clear project description
- Setup instructions
- Usage examples
- Contributing guidelines
- License information

### Component Props
```typescript
interface ButtonProps {
  /** The button's label text */
  label: string;
  /** Called when the button is clicked */
  onClick: () => void;
  /** Optional CSS class names */
  className?: string;
}
```
-e \n## File: ai_docs/standards/auth.md\n
# Authentication Standards

## Authentication Context

### Setup
```typescript
// services/auth/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Usage
```typescript
function ProtectedComponent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <SignInPrompt />

  return <ProtectedContent />
}
```

## Route Protection

### Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  return res
}
```

### Protected Routes
```typescript
// app/dashboard/layout.tsx
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/signin')
  }

  return <div>{children}</div>
}
```

## Role-Based Access Control (RBAC)

### Role Definition
```typescript
enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  ADMIN = 'admin'
}

interface User {
  id: string
  role: UserRole
  permissions: string[]
}
```

### Permission Checking
```typescript
function checkPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission)
}

function RequirePermission({ 
  permission, 
  children 
}: { 
  permission: string
  children: React.ReactNode 
}) {
  const { user } = useAuth()
  
  if (!user || !checkPermission(user, permission)) {
    return <AccessDenied />
  }

  return children
}
```

## Authentication Flow

### Sign In
```typescript
async function handleSignIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Handle successful sign in
    router.push('/dashboard')
  } catch (error) {
    // Handle error
    toast.error('Failed to sign in')
  }
}
```

### Sign Up
```typescript
async function handleSignUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`
      }
    })

    if (error) throw error

    // Handle successful sign up
    toast.success('Check your email to confirm your account')
  } catch (error) {
    // Handle error
    toast.error('Failed to sign up')
  }
}
```

### Sign Out
```typescript
async function handleSignOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Handle successful sign out
    router.push('/')
  } catch (error) {
    // Handle error
    toast.error('Failed to sign out')
  }
}
```

## Security Measures

### Password Requirements
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
})
```

### Session Management
```typescript
// Configure session settings
supabase.auth.setSession({
  access_token,
  refresh_token
})

// Handle session refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Update session state
  }
})
```

## Error Handling

### Authentication Errors
```typescript
async function handleAuthError(error: AuthError) {
  switch (error.status) {
    case 400:
      toast.error('Invalid credentials')
      break
    case 401:
      toast.error('Please sign in again')
      await signOut()
      break
    case 429:
      toast.error('Too many attempts. Please try again later')
      break
    default:
      toast.error('An unexpected error occurred')
  }
}
```

## Testing

### Auth Mocking
```typescript
// __mocks__/auth-context.tsx
export function MockAuthProvider({ 
  user = null,
  children 
}: { 
  user?: User | null
  children: React.ReactNode 
}) {
  return (
    <AuthContext.Provider value={{
      user,
      loading: false,
      isAuthenticated: !!user,
      signIn: jest.fn(),
      signOut: jest.fn()
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Testing Protected Routes
```typescript
describe('ProtectedRoute', () => {
  it('redirects to sign in when not authenticated', () => {
    render(
      <MockAuthProvider user={null}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Please sign in')).toBeInTheDocument()
  })
})
```

## OAuth Integration

### Provider Setup
```typescript
const oauthProviders = {
  google: {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: GitHubIcon,
  }
}

async function signInWithProvider(provider: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${location.origin}/auth/callback`
    }
  })
}
```

## Security Headers

### CSP Configuration
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `
  }
]
```
-e \n## File: ai_docs/standards/git.md\n
# Git & GitHub Standards

## Branch Structure
```
main (production)
  ↳ staging
    ↳ dev
      ↳ feature/*
      ↳ bugfix/*
      ↳ hotfix/*
      ↳ release/*
```

## Branch Naming Conventions

### Format
`<type>/<description>`

### Types
- `feature/` - New features (e.g., feature/video-upload)
- `bugfix/` - Non-critical fixes (e.g., bugfix/login-validation)
- `hotfix/` - Critical production fixes (e.g., hotfix/security-patch)
- `release/` - Release preparation (e.g., release/v1.2.0)
- `docs/` - Documentation updates (e.g., docs/api-reference)
- `refactor/` - Code refactoring (e.g., refactor/auth-flow)

### Description
- Use kebab-case
- Be concise but descriptive
- Include issue number if applicable (e.g., feature/video-upload-#123)

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting changes
- refactor: Code restructuring
- test: Adding/modifying tests
- chore: Maintenance tasks

### Guidelines
- Subject line limited to 72 characters
- Use present tense ("add feature" not "added feature")
- Body explains what and why, not how
- Reference issues in footer

### Examples
```
feat(auth): implement OAuth login with Google

Add Google OAuth authentication option to improve user signup experience.
Includes error handling and redirect flows.

Closes #123
```

## Pull Requests

### Title Format
`[Type] Description (#issue)`

### Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit Tests Added
- [ ] Integration Tests Added
- [ ] Manual Testing Completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] Tests passing
```

### Review Process
1. Self-review completed
2. Tests passing
3. Documentation updated
4. PR template filled
5. Requested reviewers
6. Addressed feedback

## Protected Branches

### Main Branch
- Requires pull request
- Requires approvals (2 minimum)
- Requires passing CI
- No direct pushes
- Linear history required

### Dev Branch
- Requires pull request
- Requires 1 approval
- Requires passing CI
- No direct pushes

## Common Workflows

### Feature Development
```bash
# Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# Regular commits
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feature/new-feature
```

### Bug Fixes
```bash
# Create bugfix branch
git checkout dev
git pull origin dev
git checkout -b bugfix/issue-123

# Fix and commit
git add .
git commit -m "fix(scope): description"

# Push and create PR
git push -u origin bugfix/issue-123
```

### Hotfixes
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Fix, commit, and push
git add .
git commit -m "fix(scope): description"
git push -u origin hotfix/critical-fix
```

## Best Practices

1. Keep branches short-lived
2. Rebase feature branches regularly
3. Write meaningful commit messages
4. Create focused, reviewable PRs
5. Delete merged branches
6. Keep linear history
7. Never force push to protected branches
8. Always pull before starting work

## Git Hooks

### Pre-commit
- Lint staged files
- Run type checks
- Run unit tests
- Check commit message format

### Pre-push
- Run full test suite
- Check build
- Verify branch naming

## Continuous Integration

### Checks Required
- Type checking
- Linting
- Unit tests
- Integration tests
- Build verification
- Coverage thresholds

### Automated Processes
- PR labeling
- Branch protection
- Status checks
- Deployment previews

## Release Process

1. Create release branch
```bash
git checkout dev
git checkout -b release/v1.0.0
```

2. Version bump and changelog
```bash
npm version 1.0.0
git add .
git commit -m "chore(release): v1.0.0"
```

3. Merge to main
```bash
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

4. Merge back to dev
```bash
git checkout dev
git merge release/v1.0.0
git push origin dev
```

## Troubleshooting

### Common Issues
1. Merge Conflicts
   - Pull latest changes
   - Rebase if necessary
   - Resolve conflicts locally
   - Test after resolution

2. Failed CI
   - Check logs
   - Run tests locally
   - Fix issues
   - Push updates

3. Branch Management
   - Keep branches updated
   - Delete stale branches
   - Use correct base branch
   - Follow naming conventions

## Support

- Review this documentation
- Check commit history
- Use PR templates
- Ask for help when needed
-e \n## File: ai_docs/standards/react.md\n
# React Development Standards

## Component Architecture

### Functional Components
```typescript
// Preferred
export function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// Avoid
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.user.name}</div>;
  }
}
```

### Props Interface
```typescript
interface UserProfileProps {
  // Required props first
  user: User;
  onUpdate: (user: User) => void;
  
  // Optional props after
  className?: string;
  children?: React.ReactNode;
}
```

## Hooks Usage

### State Management
```typescript
// Local state
const [isOpen, setIsOpen] = useState(false);

// Complex state
const [state, dispatch] = useReducer(reducer, initialState);

// Derived state
const isValid = useMemo(() => {
  return validateData(data);
}, [data]);
```

### Side Effects
```typescript
// Data fetching
useEffect(() => {
  async function fetchData() {
    const data = await api.getData();
    setData(data);
  }
  fetchData();
}, []);

// Cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### Custom Hooks
```typescript
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

## Performance Optimization

### Memoization
```typescript
// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => b.price - a.price);
}, [items]);

// Memoize callbacks
const handleSubmit = useCallback(() => {
  // Handle submission
}, [dependencies]);

// Memoize components
const MemoizedComponent = memo(Component);
```

### Code Splitting
```typescript
// Lazy loading
const UserProfile = lazy(() => import('./UserProfile'));

// Suspense boundary
<Suspense fallback={<Loading />}>
  <UserProfile />
</Suspense>
```

## Error Handling

### Error Boundaries
```typescript
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Async Error Handling
```typescript
async function handleSubmit() {
  try {
    await submitData();
  } catch (error) {
    if (error instanceof ValidationError) {
      setFieldErrors(error.fields);
    } else {
      setGlobalError(error.message);
    }
  }
}
```

## Testing

### Component Testing
```typescript
describe('UserProfile', () => {
  it('renders user information', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  it('handles updates', async () => {
    const onUpdate = jest.fn();
    render(<UserProfile user={mockUser} onUpdate={onUpdate} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onUpdate).toHaveBeenCalled();
  });
});
```

## Accessibility

### ARIA Attributes
```typescript
function Dialog({ isOpen, onClose, title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <h2 id="dialog-title">{title}</h2>
      <div id="dialog-description">{children}</div>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Keyboard Navigation
```typescript
function NavigationMenu() {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        setActiveIndex(i => (i + 1) % items.length);
        break;
      case 'ArrowLeft':
        setActiveIndex(i => (i - 1 + items.length) % items.length);
        break;
    }
  }

  return (
    <nav role="navigation" onKeyDown={handleKeyDown}>
      {/* Navigation items */}
    </nav>
  );
}
```

## State Management

### Context Usage
```typescript
// Context definition
const UserContext = createContext<UserContextType | null>(null);

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const value = useMemo(() => ({
    user,
    setUser
  }), [user]);
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

## Forms

### Form Handling
```typescript
function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data);
    } catch (error) {
      form.setError('root', { message: error.message });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Documentation

### Component Documentation
```typescript
/**
 * UserProfile displays and manages user information
 *
 * @example
 * ```tsx
 * <UserProfile
 *   user={currentUser}
 *   onUpdate={handleUpdate}
 * />
 * ```
 */
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  // Implementation
}
```

## Security

### Data Sanitization
```typescript
function Comment({ content }: { content: string }) {
  // Sanitize content before rendering
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

## Performance Monitoring

### Metrics Collection
```typescript
function MetricsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Report Web Vitals
    reportWebVitals(metric => {
      analytics.track(metric.name, metric);
    });
  }, []);

  return children;
}
```
-e \n## File: ai_docs/standards/docs.md\n
# Documentation Standards

## Code Documentation

### Component Documentation
```typescript
/**
 * VideoPlayer component for displaying lesson content
 *
 * @component
 * @example
 * ```tsx
 * <VideoPlayer
 *   playbackId="abcd1234"
 *   title="Introduction to React"
 *   autoPlay={false}
 * />
 * ```
 */
export function VideoPlayer({
  playbackId,
  title,
  autoPlay = false
}: VideoPlayerProps) {
  // Implementation
}
```

### Function Documentation
```typescript
/**
 * Creates a new lesson in the database
 *
 * @param {LessonInput} input - The lesson data
 * @returns {Promise<Lesson>} The created lesson
 * @throws {ValidationError} If the input is invalid
 * @throws {DatabaseError} If the database operation fails
 */
async function createLesson(input: LessonInput): Promise<Lesson> {
  // Implementation
}
```

### Type Documentation
```typescript
/**
 * Represents a lesson in the system
 * @interface
 */
interface Lesson {
  /** Unique identifier for the lesson */
  id: string;
  /** Title of the lesson */
  title: string;
  /** Detailed description */
  description: string;
  /** Price in cents */
  price: number;
  /** Creation timestamp */
  createdAt: Date;
}
```

## README Standards

### Project README
```markdown
# Project Name

Brief description of the project.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+

### Installation
1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Start the development server

## Development

### Architecture
Overview of the project architecture...

### Key Technologies
- Next.js 14
- Supabase
- Stripe
- Mux

### Development Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit PR

## Deployment

### Environment Setup
Instructions for setting up deployment...

### Deployment Process
Steps for deploying the application...
```

### Component README
```markdown
# Component Name

Description of the component's purpose and usage.

## Props

| Name     | Type     | Default | Description     |
|----------|----------|---------|-----------------|
| prop1    | string   | -       | Description... |
| prop2    | boolean  | false   | Description... |

## Examples

\```tsx
<ComponentName
  prop1="value"
  prop2={true}
/>
\```

## Notes
Additional information about usage...
```

## API Documentation

### API Endpoint Documentation
```typescript
/**
 * @api {post} /api/lessons Create Lesson
 * @apiName CreateLesson
 * @apiGroup Lessons
 *
 * @apiParam {String} title Lesson title
 * @apiParam {String} description Lesson description
 * @apiParam {Number} price Lesson price in cents
 *
 * @apiSuccess {String} id Lesson ID
 * @apiSuccess {String} title Lesson title
 * @apiSuccess {String} description Lesson description
 * @apiSuccess {Number} price Lesson price
 *
 * @apiError {Object} error Error object
 * @apiError {String} error.message Error message
 */
export async function POST(req: Request) {
  // Implementation
}
```

### API Response Examples
```typescript
// Success Response
{
  "id": "123",
  "title": "React Basics",
  "description": "Learn React fundamentals",
  "price": 2999
}

// Error Response
{
  "error": {
    "message": "Invalid lesson data"
  }
}
```

## Documentation Organization

### Directory Structure
```
docs/
├── api/
│   ├── endpoints.md
│   └── examples.md
├── components/
│   ├── ui/
│   └── features/
├── deployment/
│   ├── setup.md
│   └── process.md
└── development/
    ├── getting-started.md
    └── workflow.md
```

### Version Control
- Document version numbers
- Track documentation changes
- Include change history
- Link to related issues

## Style Guide

### Markdown Guidelines
- Use proper headings
- Include code examples
- Add table of contents
- Use consistent formatting

### Code Examples
- Show practical usage
- Include error handling
- Demonstrate best practices
- Keep examples concise

## Testing Documentation

### Test Documentation
```typescript
describe('LessonCard', () => {
  /**
   * Verifies that the lesson card displays
   * all required information correctly
   */
  it('displays lesson information', () => {
    // Test implementation
  })

  /**
   * Ensures proper error handling when
   * lesson data is invalid
   */
  it('handles invalid data', () => {
    // Test implementation
  })
})
```

### Test Coverage
- Document coverage goals
- Explain test strategy
- Include testing guide
- Show example tests

## Maintenance

### Documentation Review
- Regular updates
- Accuracy checks
- Broken link fixes
- Format consistency

### Contribution Guide
- Style requirements
- Review process
- Update procedure
- Quality standards

## Best Practices

### Writing Style
- Clear and concise
- Consistent tone
- Proper grammar
- Active voice

### Documentation Types
- API reference
- User guides
- Tutorials
- Architecture docs

### Tools and Integration
- JSDoc generation
- Markdown linting
- Automated checks
- Version tracking

### Accessibility
- Clear structure
- Proper formatting
- Alternative text
- Keyboard navigation
-e \n## File: ai_docs/standards/code.md\n
# Code Standards

## TypeScript Guidelines

### Type Safety
- Enable strict mode
- No `any` types
- Use proper type annotations
- Define interfaces for data structures

### Code Organization
```typescript
// Imports
import { useState } from 'react';
import type { User } from '@/types';

// Types/Interfaces
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

// Component/Function
export function UserProfile({ user, onUpdate }: Props) {
  // Implementation
}
```

### Naming Conventions
- PascalCase for components, types, interfaces
- camelCase for variables, functions, methods
- UPPER_CASE for constants
- Use descriptive names

### File Structure
- One component per file
- Consistent file naming
- Logical directory organization
- Clear import paths

## Clean Code Principles

### Functions
- Single responsibility
- Clear purpose
- Descriptive names
- Limited parameters
- Early returns

### Error Handling
- Use try/catch appropriately
- Custom error types
- Proper error propagation
- Meaningful error messages

### Comments
- Self-documenting code
- JSDoc for public APIs
- Explain complex logic
- Keep updated

### Code Style
- Consistent formatting
- Clear spacing
- Logical grouping
- ESLint compliance

## Best Practices

### State Management
- Minimize state
- Use appropriate hooks
- Clear update patterns
- Proper initialization

### Performance
- Optimize renders
- Memoize when needed
- Lazy loading
- Code splitting

### Security
- Input validation
- Data sanitization
- Secure operations
- Error handling

### Testing
- Unit tests
- Integration tests
- Test coverage
- Meaningful assertions

## Code Review Guidelines

### Review Checklist
- Type safety
- Error handling
- Performance
- Security
- Tests
- Documentation

### Common Issues
- Type errors
- Memory leaks
- Security vulnerabilities
- Performance bottlenecks
- Poor error handling

## Documentation

### Code Documentation
- Clear README
- API documentation
- Setup instructions
- Usage examples

### Maintenance
- Regular updates
- Version control
- Change logging
- Issue tracking
-e \n## File: ai_docs/standards/security.md\n
# Security Standards

## Authentication & Authorization

### Supabase Auth Implementation
- AuthContext provider from '@/app/services/auth/AuthContext'
- Protected routes via middleware
- Role-based access via Supabase RLS
- Session management with useAuth() hook
- Secure token handling and refresh

### 2. API Security
- Input validation with Zod
- Request rate limiting
- CORS configuration
- API key management
- Error handling

## Data Protection

### 1. Database Security
- Row Level Security (RLS)
- Data encryption
- Backup procedures
- Access logging
- Query optimization

### 2. Payment Security
- PCI compliance
- Stripe security best practices
- Webhook verification
- Error handling
- Audit logging

## Implementation Guidelines

### 1. Input Validation
```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin'])
});
```

### 2. Authentication Flow
```typescript
// Protected API route
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle request
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
```

### 3. Error Handling
```typescript
try {
  // Operation
} catch (error) {
  // Log error securely
  logger.error('Operation failed', {
    error: error.message,
    code: error.code,
    // No sensitive data
  });
  
  // Return safe error
  return {
    message: 'Operation failed',
    code: 'OPERATION_ERROR'
  };
}
```

## Security Checklist

### Development
- [ ] Input validation
- [ ] Authentication
- [ ] Authorization
- [ ] Error handling
- [ ] Data encryption
- [ ] Secure headers
- [ ] CSRF protection
- [ ] XSS prevention

### Deployment
- [ ] Environment variables
- [ ] Secret management
- [ ] SSL/TLS setup
- [ ] Firewall rules
- [ ] Rate limiting
- [ ] Monitoring
- [ ] Logging
- [ ] Backup system

### Testing
- [ ] Security testing
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Access control testing
- [ ] Error handling testing
- [ ] Input validation testing
- [ ] Authentication testing
- [ ] Authorization testing

## Monitoring & Logging

### 1. Security Logging
```typescript
const logger = {
  error: (message: string, context: Record<string, unknown>) => {
    // Secure logging implementation
  },
  warn: (message: string, context: Record<string, unknown>) => {
    // Warning logging
  },
  audit: (message: string, context: Record<string, unknown>) => {
    // Audit logging
  }
};
```

### 2. Monitoring Setup
- Real-time alerts
- Error tracking
- Performance monitoring
- Security scanning
- Access logging
- Audit trails

## Incident Response

### 1. Response Plan
1. Detect & Alert
2. Assess Impact
3. Contain Threat
4. Investigate Cause
5. Remediate Issue
6. Review & Improve

### 2. Recovery Process
1. Backup Restoration
2. System Verification
3. Security Updates
4. Access Review
5. Documentation
6. Post-mortem

## Compliance

### 1. Standards
- GDPR compliance
- CCPA compliance
- SOC 2 requirements
- PCI DSS (if applicable)
- Local regulations

### 2. Documentation
- Security policies
- Procedures
- Incident reports
- Audit logs
- Compliance records
