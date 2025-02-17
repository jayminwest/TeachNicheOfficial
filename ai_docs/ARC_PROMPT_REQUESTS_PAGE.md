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


### Files To Be Created/Modified



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

