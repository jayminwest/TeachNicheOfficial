# Data Management Standards

## Supabase Integration

### Client Setup
```typescript
// lib/firebase/client.ts
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
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
// Good: Specific field selection
import { collection, query, where, getDocs } from 'firebase/firestore'

const lessonsRef = collection(db, 'lessons')
const q = query(lessonsRef, where('user_id', '==', userId))
const querySnapshot = await getDocs(q)
const lessons = querySnapshot.docs.map(doc => {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.title,
    description: data.description
  }
})

// Avoid: Getting all fields
const querySnapshot = await getDocs(q)
const lessons = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data() // Gets all fields
}))
```

#### Pagination
```typescript
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore'

const ITEMS_PER_PAGE = 10

async function fetchLessons(page: number, lastDoc = null) {
  const lessonsRef = collection(db, 'lessons')
  
  let q
  if (lastDoc) {
    // Get next page
    q = query(
      lessonsRef,
      orderBy('created_at', 'desc'),
      startAfter(lastDoc),
      limit(ITEMS_PER_PAGE)
    )
  } else {
    // Get first page
    q = query(
      lessonsRef,
      orderBy('created_at', 'desc'),
      limit(ITEMS_PER_PAGE)
    )
  }
  
  const querySnapshot = await getDocs(q)
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
  
  return {
    lessons: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: lastVisible // Pass this to get the next page
  }
}
```

### Error Handling

#### Database Errors
```typescript
try {
  const docRef = await firebaseDb.collection("lessons").add(lesson)
  return { id: docRef.id, ...lesson }
} catch (error) {
  logger.error('Database error:', error)
  throw new Error('Failed to create lesson')
}
```

### Real-time Subscriptions

#### Setup
```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore'

function useRealtimeData(collectionName: string, conditions: Record<string, any>) {
  const [data, setData] = useState([])
  
  useEffect(() => {
    const collectionRef = collection(db, collectionName)
    
    // Build query with conditions
    const constraints = Object.entries(conditions).map(
      ([field, value]) => where(field, '==', value)
    )
    const q = query(collectionRef, ...constraints)
    
    // Set up realtime listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setData(newData)
    })

    // Clean up listener
    return () => {
      unsubscribe()
    }
  }, [collectionName, JSON.stringify(conditions)])
  
  return data
}
```

## Data Access Patterns

### Repository Pattern
```typescript
class LessonRepository {
  async findById(id: string): Promise<Lesson> {
    const lessonRef = db.collection('lessons').doc(id)
    const doc = await lessonRef.get()
    
    if (!doc.exists) {
      throw new Error('Lesson not found')
    }
    
    return { id: doc.id, ...doc.data() }
  }

  async create(lesson: Lesson): Promise<void> {
    await db.collection('lessons').add(lesson)
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
