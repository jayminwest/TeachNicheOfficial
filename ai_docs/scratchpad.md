# Lesson Requests Feature Implementation Guide

## Overview
This document outlines the step-by-step implementation of the lesson requests feature, allowing authenticated users to create and vote on lesson requests. Create and ask to edit all necessary files.

## Database Schema
```typescript
// lesson_requests table
{
  id: uuid (default: uuid_generate_v4()),
  title: text (required),
  description: text (required),
  created_at: timestamp with time zone (default: now()),
  user_id: uuid,
  status: text (default: 'open'),
  vote_count: integer (default: 0),
  category: text,
  tags: array
}

// lesson_request_votes table
{
  id: uuid (default: uuid_generate_v4()),
  request_id: uuid,
  user_id: uuid,
  vote_type: text,
  created_at: timestamp with time zone (default: now())
}
```

## Implementation Steps

### Step 1: Core Types and Schemas
Files to create:
1. `app/lib/types.ts`:
```typescript
interface LessonRequest {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  status: 'open' | 'in_progress' | 'completed';
  vote_count: number;
  category: string;
  tags: string[];
}

interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}
```

2. `app/lib/schemas/lesson-request.ts`:
```typescript
import * as z from 'zod'

export const lessonRequestSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string(),
  tags: z.array(z.string()).optional()
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>
```

### Step 2: Database Functions
Create `app/lib/supabase/requests.ts`:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LessonRequest, LessonRequestVote } from '../types'
import { LessonRequestFormData } from '../schemas/lesson-request'

export async function createRequest(data: LessonRequestFormData) {
  const supabase = createClientComponentClient()
  const { data: request, error } = await supabase
    .from('lesson_requests')
    .insert([data])
    .select()
    .single()
  
  if (error) throw error
  return request
}

export async function getRequests(filters?: {
  category?: string,
  status?: string,
  sortBy?: string
}) {
  const supabase = createClientComponentClient()
  let query = supabase
    .from('lesson_requests')
    .select('*')
  
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function voteOnRequest(requestId: string, voteType: 'upvote' | 'downvote') {
  const supabase = createClientComponentClient()
  const { data: existingVote } = await supabase
    .from('lesson_request_votes')
    .select()
    .match({ request_id: requestId })
    .single()

  if (existingVote) {
    const { error } = await supabase
      .from('lesson_request_votes')
      .delete()
      .match({ id: existingVote.id })
    if (error) throw error
  }

  const { error } = await supabase
    .from('lesson_request_votes')
    .insert([{ request_id: requestId, vote_type: voteType }])
  
  if (error) throw error
}
```

### Step 3: Components
1. Create `app/requests/components/request-form.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lessonRequestSchema, LessonRequestFormData } from '@/lib/schemas/lesson-request'
import { createRequest } from '@/lib/supabase/requests'

export function RequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LessonRequestFormData>({
    resolver: zodResolver(lessonRequestSchema)
  })

  const onSubmit = async (data: LessonRequestFormData) => {
    try {
      setIsSubmitting(true)
      await createRequest(data)
      // Handle success (reset form, show message, etc)
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

2. Create `app/requests/components/request-card.tsx`:
```typescript
import { LessonRequest } from '@/lib/types'
import { voteOnRequest } from '@/lib/supabase/requests'

interface RequestCardProps {
  request: LessonRequest
  onVote: () => void
}

export function RequestCard({ request, onVote }: RequestCardProps) {
  const handleVote = async (type: 'upvote' | 'downvote') => {
    try {
      await voteOnRequest(request.id, type)
      onVote()
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h3>{request.title}</h3>
      <p>{request.description}</p>
      <div className="flex gap-2">
        <button onClick={() => handleVote('upvote')}>Upvote</button>
        <span>{request.vote_count}</span>
        <button onClick={() => handleVote('downvote')}>Downvote</button>
      </div>
    </div>
  )
}
```

3. Create `app/requests/components/request-grid.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { LessonRequest } from '@/lib/types'
import { getRequests } from '@/lib/supabase/requests'
import { RequestCard } from './request-card'

export function RequestGrid() {
  const [requests, setRequests] = useState<LessonRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadRequests = async () => {
    try {
      const data = await getRequests()
      setRequests(data)
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.map(request => (
        <RequestCard 
          key={request.id} 
          request={request}
          onVote={loadRequests}
        />
      ))}
    </div>
  )
}
```

### Step 4: Main Page
Create `app/requests/page.tsx`:
```typescript
import { RequestForm } from './components/request-form'
import { RequestGrid } from './components/request-grid'

export default function RequestsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Lesson Requests</h1>
      <div className="mb-8">
        <RequestForm />
      </div>
      <RequestGrid />
    </div>
  )
}
```

### Step 5: API Routes
1. Create `app/api/requests/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('lesson_requests')
      .insert([{ ...body, user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

2. Create `app/api/requests/vote/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { requestId, voteType } = await request.json()
    
    // Handle vote logic here
    const { error } = await supabase
      .from('lesson_request_votes')
      .insert([{
        request_id: requestId,
        user_id: session.user.id,
        vote_type: voteType
      }])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### Step 6: Testing
Create test files:

1. `__tests__/requests/request-form.test.tsx`
2. `__tests__/requests/request-card.test.tsx`
3. `__tests__/requests/request-grid.test.tsx`

Example test structure:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { RequestForm } from '@/app/requests/components/request-form'

describe('RequestForm', () => {
  it('renders form fields', () => {
    render(<RequestForm />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  // Add more tests
})
```

### Step 7: Navigation Update
Add to existing navigation component:
```typescript
<Link href="/requests" className="nav-link">
  Lesson Requests
</Link>
```

## Implementation Order
1. Set up database functions and types (Step 1 & 2)
2. Create basic components without styling (Step 3)
3. Implement main page structure (Step 4)
4. Add API routes (Step 5)
5. Connect components to API
6. Add tests (Step 6)
7. Update navigation (Step 7)
8. Polish UI and add error handling
9. Add loading states and optimistic updates

## Testing
Run tests:
```bash
npm test
```

## Deployment
After implementing all features:
```bash
npm run build
```

Check for any build errors and deploy.
