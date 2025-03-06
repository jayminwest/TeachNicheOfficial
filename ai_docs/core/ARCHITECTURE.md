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
   // Example from lessonsService.ts
   async createLesson(data: LessonCreateData, userId: string): Promise<DatabaseResponse<Lesson>> {
     // Implementation for creating a new lesson
   }
   ```

2. **Content Discovery**:
   ```typescript
   // Example from lessonsService.ts
   async getLessons(options?: { 
     limit?: number; 
     offset?: number; 
     orderBy?: string;
     orderDirection?: 'asc' | 'desc';
   }): Promise<DatabaseResponse<Lesson[]>> {
     // Implementation for retrieving lessons
   }
   ```

3. **Content Consumption**:
   ```tsx
   // Example from video-player.tsx
   <MuxPlayer
     playbackId={playbackId}
     streamType="on-demand"
     tokens={jwt ? { playback: jwt } : undefined}
     // Additional configuration
   />
   ```

4. **Transactions**:
   ```typescript
   // Example from purchasesService.ts
   async createPurchase(data: PurchaseCreateData): Promise<DatabaseResponse<Purchase>> {
     // Implementation for recording a purchase
   }
   ```

## Security Architecture

- **Authentication**: Supabase Auth with session management
- **Authorization**: Row-Level Security in PostgreSQL
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Input validation with Zod, CSRF protection
- **Content Security**: Signed URLs for video content
- **End-to-End Testing**: Security flows tested with Playwright

## Testing Architecture

- **Unit Testing**: Jest for component and function tests
- **Integration Testing**: Testing interactions between components
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
