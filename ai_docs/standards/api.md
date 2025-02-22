# API Development Standards

## API Structure

### 1. Route Organization
```
app/api/
├── auth/
├── lessons/
├── payments/
├── users/
└── webhooks/
```

### 2. Response Format
```typescript
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
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
  res: NextApiResponse
) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.details
      }
    });
  }
  
  // Log error and return safe response
  logger.error('API error', { error });
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
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
