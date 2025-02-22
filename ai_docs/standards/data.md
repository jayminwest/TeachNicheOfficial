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
function logDatabaseError(error: Error, context: object) {
  logger.error('Database error:', {
    error: error.message,
    stack: error.stack,
    ...context
  })
}
```

### Performance Monitoring
- Track query times
- Monitor connection pool
- Set up alerts
- Regular maintenance
