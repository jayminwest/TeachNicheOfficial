# API Endpoints Reference

This document provides a comprehensive reference for all API endpoints in the Teach Niche platform.

## Authentication Endpoints

### POST /api/auth/sign-up
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "session": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /api/auth/sign-in
Authenticates a user and creates a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "session": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /api/auth/sign-out
Ends the current user session.

**Response:**
```json
{
  "success": true
}
```

## Lesson Endpoints

### GET /api/lessons
Retrieves a list of lessons with optional filtering.

**Query Parameters:**
- `category` - Filter by category
- `featured` - Filter for featured lessons
- `creator` - Filter by creator ID
- `limit` - Number of results to return
- `offset` - Pagination offset

**Response:**
```json
{
  "lessons": [
    {
      "id": "lesson-uuid",
      "title": "Lesson Title",
      "description": "Lesson description",
      "price": 1999,
      "creatorId": "creator-uuid",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "status": "published",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

### GET /api/lessons/:id
Retrieves a specific lesson by ID.

**Response:**
```json
{
  "id": "lesson-uuid",
  "title": "Lesson Title",
  "description": "Lesson description",
  "price": 1999,
  "creatorId": "creator-uuid",
  "content": "Lesson content markdown",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "status": "published",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-02T00:00:00Z",
  "categories": [
    {
      "id": "category-uuid",
      "name": "Category Name"
    }
  ],
  "creator": {
    "id": "creator-uuid",
    "fullName": "Creator Name",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

### POST /api/lessons
Creates a new lesson.

**Request Body:**
```json
{
  "title": "New Lesson",
  "description": "Lesson description",
  "price": 1999,
  "content": "Lesson content markdown",
  "categoryIds": ["category-uuid"],
  "status": "draft"
}
```

**Response:**
```json
{
  "id": "new-lesson-uuid",
  "title": "New Lesson",
  "description": "Lesson description",
  "price": 1999,
  "creatorId": "creator-uuid",
  "content": "Lesson content markdown",
  "status": "draft",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### PUT /api/lessons/:id
Updates an existing lesson.

**Request Body:**
```json
{
  "title": "Updated Lesson Title",
  "description": "Updated description",
  "price": 2499,
  "content": "Updated content markdown",
  "categoryIds": ["category-uuid"],
  "status": "published"
}
```

**Response:**
```json
{
  "id": "lesson-uuid",
  "title": "Updated Lesson Title",
  "description": "Updated description",
  "price": 2499,
  "creatorId": "creator-uuid",
  "content": "Updated content markdown",
  "status": "published",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-02T00:00:00Z"
}
```

### DELETE /api/lessons/:id
Deletes a lesson (soft delete).

**Response:**
```json
{
  "success": true
}
```

## Payment Endpoints

### POST /api/payments/create-checkout
Creates a Stripe checkout session for a lesson purchase.

**Request Body:**
```json
{
  "lessonId": "lesson-uuid",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "stripe-session-id",
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/payments/purchases
Retrieves a list of the current user's purchases.

**Response:**
```json
{
  "purchases": [
    {
      "id": "purchase-uuid",
      "lessonId": "lesson-uuid",
      "purchaseDate": "2025-01-01T00:00:00Z",
      "amount": 1999,
      "status": "completed",
      "lesson": {
        "id": "lesson-uuid",
        "title": "Lesson Title",
        "thumbnailUrl": "https://example.com/thumbnail.jpg"
      }
    }
  ]
}
```

### GET /api/payments/purchases/:lessonId
Checks if the current user has purchased a specific lesson.

**Response:**
```json
{
  "hasAccess": true,
  "purchaseStatus": "completed",
  "purchaseDate": "2025-01-01T00:00:00Z"
}
```

## Creator Earnings Endpoints

### GET /api/earnings
Retrieves earnings information for the current creator.

**Query Parameters:**
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `status` - Filter by status (pending, paid)

**Response:**
```json
{
  "totalEarnings": 10000,
  "pendingEarnings": 5000,
  "paidEarnings": 5000,
  "earnings": [
    {
      "id": "earning-uuid",
      "lessonId": "lesson-uuid",
      "amount": 1599,
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00Z",
      "lesson": {
        "title": "Lesson Title"
      }
    }
  ]
}
```

### GET /api/earnings/lessons/:lessonId
Retrieves earnings for a specific lesson.

**Response:**
```json
{
  "totalEarnings": 5000,
  "purchaseCount": 25,
  "earnings": [
    {
      "id": "earning-uuid",
      "amount": 1599,
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## Payout Endpoints

### POST /api/payouts/bank-account
Adds or updates a bank account for receiving payouts.

**Request Body:**
```json
{
  "bankAccountToken": "btok_123456",
  "accountHolderName": "John Doe"
}
```

**Response:**
```json
{
  "id": "bank-account-uuid",
  "lastFour": "6789",
  "bankName": "Test Bank",
  "isDefault": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### GET /api/payouts/bank-accounts
Retrieves the creator's bank accounts.

**Response:**
```json
{
  "bankAccounts": [
    {
      "id": "bank-account-uuid",
      "lastFour": "6789",
      "bankName": "Test Bank",
      "isDefault": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/payouts
Retrieves the creator's payout history.

**Query Parameters:**
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `status` - Filter by status (pending, completed, failed)

**Response:**
```json
{
  "payouts": [
    {
      "id": "payout-uuid",
      "amount": 5000,
      "status": "completed",
      "destinationLastFour": "6789",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## Webhook Endpoints

### POST /api/webhooks/stripe
Handles Stripe webhook events.

**Request Body:**
Stripe event object

**Response:**
```json
{
  "received": true
}
```

## Admin Endpoints

### POST /api/admin/process-payouts
Manually triggers the payout processing job (admin only).

**Response:**
```json
{
  "success": true,
  "payoutsProcessed": 10
}
```

### GET /api/admin/earnings
Retrieves earnings information for all creators (admin only).

**Query Parameters:**
- `creatorId` - Filter by creator ID
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `status` - Filter by status (pending, paid)

**Response:**
```json
{
  "totalEarnings": 50000,
  "pendingEarnings": 20000,
  "paidEarnings": 30000,
  "creatorEarnings": [
    {
      "creatorId": "creator-uuid",
      "creatorName": "Creator Name",
      "totalEarnings": 10000,
      "pendingEarnings": 5000,
      "paidEarnings": 5000
    }
  ]
}
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

Common error codes:
- `unauthorized` - Authentication required
- `forbidden` - Insufficient permissions
- `not_found` - Resource not found
- `validation_error` - Invalid input data
- `internal_error` - Server error
- `payment_failed` - Payment processing failed

## Rate Limiting

All API endpoints are subject to rate limiting:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers are included in all responses:
- `X-RateLimit-Limit` - Requests allowed per window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Time when the rate limit resets

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | API Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
