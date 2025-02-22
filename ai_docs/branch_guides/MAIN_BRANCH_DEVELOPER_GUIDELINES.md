# Main Branch Additional Requirements

These requirements are specific to main branch development and reviews, supplementing the core DEVELOPER_GUIDELINES.md.

## Performance Thresholds
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s

## Security Requirements
- OWASP Top 10 compliance
- CSP headers configured
- Auth token handling review
- Proper error messages (no sensitive data leaks)

## Testing Coverage
- 100% test coverage for critical paths
- Integration tests for auth flows
- E2E tests for payment processes
- Load testing for API endpoints

## Deployment Safety
- Zero-downtime deployment plan
- Rollback procedure documented
- Database migration safety
- CDN configuration review
