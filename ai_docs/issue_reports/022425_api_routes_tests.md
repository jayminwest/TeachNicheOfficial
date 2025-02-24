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

## Acceptance Criteria
- [ ] Unit tests for all endpoints
- [ ] Integration tests for API flows
- [ ] Error handling coverage
- [ ] Input validation tests
- [ ] Authentication tests
- [ ] Response format tests
- [ ] Test coverage >90%

## Labels
- bug
- testing
- api
- critical

## Resources
- [Testing Standards](ai_docs/standards/testing.md)
- [API Documentation](app/api/)
