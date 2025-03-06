# Architecture Overview

This document provides a high-level overview of the Teach Niche platform architecture. The architecture is designed to be modular, scalable, and secure, with clear separation of concerns.

## System Architecture

### Client Layer
- **Web Application**: Next.js v15.1.7 frontend with React v19.0.0 components
- **Mobile Responsive Design**: Adaptive UI using Tailwind CSS
- **Progressive Enhancement**: Core functionality works without JavaScript

### API Layer
- **Next.js API Routes**: Server-side API endpoints in `/app/api/` directory
- **Supabase API**: Direct database access with Row-Level Security
- **Webhooks**: For integration with Stripe and Mux

### Service Layer
- **Authentication Service**: Supabase Auth for user identity and access management
- **Database Service**: Modular services for database operations
- **Payment Service**: Stripe integration for processing transactions
- **Video Service**: Mux for video processing and delivery
- **Storage Service**: Supabase Storage for file management

### Data Layer
- **PostgreSQL Database**: Primary data store via Supabase
- **Supabase Storage**: For file storage
- **Mux Storage**: For video content

## Data Flow

1. **Content Creation**:
   ```typescript
   // Example from DatabaseService pattern
   async executeWithRetry<T>(
     operation: () => Promise<T>,
     options?: { maxRetries?: number; retryDelay?: number }
   ): Promise<DatabaseResponse<T>> {
     const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
     const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;
     
     let lastError: Error | null = null;
     
     for (let attempt = 0; attempt <= maxRetries; attempt++) {
       try {
         const data = await operation();
         return { data, error: null, success: true };
       } catch (error) {
         lastError = error as Error;
         if (attempt < maxRetries) {
           await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
         }
       }
     }
     
     return {
       data: null,
       error: lastError,
       success: false
     };
   }
   ```

2. **Content Discovery**:
   ```typescript
   // Example from API route pattern
   export async function GET(request: Request) {
     try {
       const { searchParams } = new URL(request.url);
       const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
       const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
       
       const lessonsService = new LessonsService();
       const response = await lessonsService.getLessons({ limit, offset });
       
       if (!response.success) {
         return NextResponse.json(
           { error: response.error?.message || 'Failed to fetch lessons' },
           { status: 500 }
         );
       }
       
       return NextResponse.json(response.data);
     } catch (error) {
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

3. **Content Access Control**:
   ```typescript
   // Example from use-lesson-access.ts
   export function useLessonAccess(lessonId: string) {
     const [hasAccess, setHasAccess] = useState<boolean | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     
     useEffect(() => {
       const checkAccess = async () => {
         try {
           // Check sessionStorage cache first
           const cachedAccess = sessionStorage.getItem(`lesson-access-${lessonId}`);
           if (cachedAccess) {
             setHasAccess(cachedAccess === 'true');
             setIsLoading(false);
             return;
           }
           
           const response = await fetch(`/api/lessons/check-purchase?lessonId=${lessonId}`);
           
           if (!response.ok) {
             throw new Error('Failed to check lesson access');
           }
           
           const data = await response.json();
           setHasAccess(data.hasAccess);
           
           // Cache the result
           sessionStorage.setItem(`lesson-access-${lessonId}`, data.hasAccess.toString());
         } catch (err) {
           setError((err as Error).message);
         } finally {
           setIsLoading(false);
         }
       };
       
       checkAccess();
     }, [lessonId]);
     
     return { hasAccess, isLoading, error };
   }
   ```

4. **Data Validation**:
   ```typescript
   // Example from schema validation pattern
   export const lessonRequestSchema = z.object({
     title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
     description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description must be less than 1000 characters"),
     category: z.string().min(1, "Category is required"),
     instagram_handle: z.string().optional().transform(val => {
       if (!val) return null;
       // Remove @ if present
       return val.startsWith('@') ? val.substring(1) : val;
     }),
     status: z.enum(["open", "in_progress", "completed"]).default("open")
   });
   ```

## Security Architecture

- **Authentication**: Supabase Auth with session management and OAuth providers
- **Authorization**: Row-Level Security in PostgreSQL with policy-based access control
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Input validation with Zod schemas, CSRF protection
- **Content Security**: Signed URLs for video content with JWT tokens
- **Error Handling**: Consistent error patterns that don't leak sensitive information
- **Database Access**: Structured through service classes with retry mechanisms
- **Session Management**: Secure session handling with proper expiration
- **End-to-End Testing**: Security flows tested with Jest and Playwright

## Testing Architecture

- **Unit Testing**: Jest for component and function tests
- **Integration Testing**: Testing interactions between components and services
- **API Testing**: Dedicated tests for API routes with mocked dependencies
  ```typescript
  // Example from purchase-flow.test.ts
  describe('Purchase Flow', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });
    });
    
    it('should create a purchase record when checkout is successful', async () => {
      // Test implementation
    });
  });
  ```
- **Mock Patterns**: Consistent mocking of external services
- **End-to-End Testing**: Playwright for complete user journeys
  ```bash
  # From package.json
  "test:e2e": "npx playwright test --config=e2e-tests/playwright.config.ts"
  ```
- **Visual Regression**: Screenshot comparison for UI consistency
  ```bash
  # From package.json
  "test:visual": "PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npx playwright test --project='Visual Tests' --config=e2e-tests/playwright.config.ts"
  ```
- **Accessibility Testing**: Using axe-core with Playwright

## Scalability Considerations

- **Edge Functions**: For global performance
- **CDN Integration**: For static content delivery
- **Database Indexing**: For query performance
- **Connection Pooling**: For database scalability
- **Serverless Architecture**: For automatic scaling

## Integration Points

- **Payment Processing**: Stripe Connect v17.6.0
  ```typescript
  // From stripe.ts
  export interface StripeConfig {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    apiVersion: '2025-01-27.acacia';
    // Additional configuration
  }
  ```
- **Video Services**: Mux for video processing and delivery
  ```typescript
  // From video-player.tsx
  interface VideoPlayerProps {
    playbackId: string;
    title: string;
    // Additional properties
  }
  ```
- **Authentication**: Supabase Auth
  ```typescript
  // From supabaseAuth.ts
  export async function getSession() {
    const supabase = createClientSupabaseClient()
    return supabase.auth.getSession()
  }
  ```
- **Database**: Supabase PostgreSQL
  ```typescript
  // From supabase.ts
  export function createClientSupabaseClient() {
    return createClientComponentClient<Database>();
  }
  ```

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-02-24 | Architecture Team | Initial version |
| 1.1 | 2024-08-15 | Architecture Team | Updated integration details |
| 1.2 | 2025-03-05 | Documentation Team | Added code examples and updated to match current implementation |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
