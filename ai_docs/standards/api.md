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
# API Development Standards

This document outlines the standards for developing APIs in the Teach Niche platform, with an emphasis on our Test Driven Development (TDD) approach and third-party API integrations.

## Test Driven Development for APIs

### Core Requirement

All API endpoints must be developed using Test Driven Development:

1. Write tests before implementing the API
2. Run the tests to verify they fail (Red)
3. Implement the minimum code to make tests pass (Green)
4. Refactor while maintaining passing tests (Refactor)
5. Repeat for additional functionality

### API Test Requirements

Every API endpoint must have the following tests before implementation:

1. **Functionality Tests**: Verify the endpoint performs its core function
2. **Input Validation Tests**: Verify the endpoint properly validates inputs
3. **Authentication Tests**: Verify the endpoint enforces proper authentication
4. **Authorization Tests**: Verify the endpoint enforces proper authorization
5. **Error Handling Tests**: Verify the endpoint handles errors gracefully
6. **Edge Case Tests**: Test boundary conditions and unusual inputs
7. **Third-Party Integration Tests**: Verify correct interaction with external services

## API Structure

### Next.js API Routes

- Place API routes in the `app/api` directory
- Use the Next.js App Router pattern
- Organize routes by resource and function

```typescript
// Example API route structure
// app/api/lessons/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Input validation schema
const lessonParamsSchema = z.object({
  id: z.string().uuid()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate input
    const validatedParams = lessonParamsSchema.parse(params)
    
    // Get Supabase client
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await firebaseAuth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch data
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', validatedParams.id)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }
    
    // Return response
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Testing APIs

### Test File Structure

```typescript
// Example test file structure
// __tests__/api/lessons/[id].test.ts
import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/lessons/[id]/route'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

describe('GET /api/lessons/[id]', () => {
  // Test authentication
  it('returns 401 when user is not authenticated', async () => {
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementation(() => ({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } })
      }
    }))
    
    const { req, res } = createMocks({
      method: 'GET',
      params: { id: '123e4567-e89b-12d3-a456-426614174000' }
    })
    
    await GET(req, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
    
    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' })
  })
  
  // Test successful response
  it('returns lesson data when found', async () => {
    const mockLesson = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Lesson',
      description: 'Test Description'
    }
    
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementation(() => ({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } }
        })
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockLesson,
              error: null
            })
          }))
        }))
      }))
    }))
    
    const { req, res } = createMocks({
      method: 'GET',
      params: { id: '123e4567-e89b-12d3-a456-426614174000' }
    })
    
    await GET(req, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
    
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ data: mockLesson })
  })
  
  // Add more tests for validation, error handling, etc.
})
```

### Testing Third-Party API Integrations

For endpoints that interact with third-party APIs:

1. Start with mocked responses for basic functionality
2. Add tests that use actual API calls to verify correct integration
3. Test error handling and edge cases

```typescript
// Example of testing an API with Stripe integration
// __tests__/api/payments/create-payment.test.ts
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/payments/create-payment/route'

// Mock tests
describe('POST /api/payments/create-payment with mocks', () => {
  beforeEach(() => {
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({
        paymentIntents: {
          create: jest.fn().mockResolvedValue({
            id: 'pi_test_123',
            client_secret: 'cs_test_123'
          })
        }
      }))
    })
  })

  it('creates a payment intent successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        amount: 1000,
        lessonId: 'lesson-123'
      }
    })
    
    await POST(req)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('clientSecret', 'cs_test_123')
  })
})

// Actual API tests (in a separate file or conditional execution)
describe('POST /api/payments/create-payment with actual Stripe', () => {
  // Only run these tests when explicitly enabled
  if (process.env.RUN_ACTUAL_API_TESTS !== 'true') {
    it('skips actual API tests', () => {
      console.log('Skipping actual Stripe API tests')
    })
    return
  }

  it('processes actual test payment intent', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        amount: 1000,
        lessonId: 'lesson-123'
      }
    })
    
    await POST(req)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('clientSecret')
    
    // Verify the payment intent was actually created in Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.retrieve(data.paymentIntentId)
    expect(paymentIntent).toHaveProperty('amount', 1000)
  })
})
```

## API Design Principles

### RESTful Design

- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Use meaningful URL paths based on resources
- Return appropriate status codes
- Use consistent response formats

### Input Validation

- Validate all inputs using Zod schemas
- Return clear validation error messages
- Sanitize inputs to prevent injection attacks

### Authentication and Authorization

- Require authentication for protected endpoints
- Implement proper authorization checks
- Use Supabase Auth for authentication
- Document authentication requirements

### Error Handling

- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging
- Handle expected and unexpected errors

### Response Format

Use a consistent response format:

```typescript
// Success response
{
  data: {
    // Response data
  }
}

// Error response
{
  error: {
    message: 'Error message',
    code: 'ERROR_CODE',
    details: {} // Optional additional details
  }
}
```

## Third-Party API Integrations

### Stripe Integration

- Use the latest Stripe API version
- Implement proper error handling
- Use webhooks for asynchronous events
- Follow Stripe's security best practices
- Test with Stripe test mode

### Supabase Integration

- Use the Supabase client for database operations
- Implement proper error handling
- Use RLS policies for security
- Test with a dedicated test project

### Mux Integration

- Use the Mux SDK for video operations
- Implement proper error handling
- Use webhooks for asynchronous events
- Test with Mux test environment

## API Documentation

- Document all endpoints with OpenAPI/Swagger
- Include request and response examples
- Document authentication requirements
- Document error responses
- Keep documentation up to date

## Performance and Security

### Performance

- Optimize database queries
- Use caching where appropriate
- Implement pagination for large result sets
- Monitor API performance

### Security

- Implement rate limiting
- Validate and sanitize all inputs
- Use HTTPS for all requests
- Implement proper authentication and authorization
- Follow OWASP security guidelines

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | API Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD and third-party API testing |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
