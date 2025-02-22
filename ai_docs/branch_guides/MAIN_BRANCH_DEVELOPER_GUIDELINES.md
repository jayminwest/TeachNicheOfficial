# Main Branch Additional Requirements

These requirements are specific to main branch development and reviews, supplementing the core DEVELOPER_GUIDELINES.md.

## Performance Thresholds
- Lighthouse score > 90: Maintain overall performance score above 90 in Lighthouse audits.
- First Contentful Paint < 1.5s: Ensure initial content renders within 1.5 seconds.
- Time to Interactive < 3.5s: Guarantee page becomes fully interactive within 3.5 seconds.

## Security Requirements
- OWASP Top 10 compliance: Meet all OWASP Top 10 security requirements.
- CSP headers configured: Implement Content Security Policy headers for all routes.
- Auth token handling review: Verify secure handling of authentication tokens.
- Proper error messages (no sensitive data leaks): Ensure error responses exclude sensitive information.

## Testing Coverage
- 100% test coverage for critical paths: Achieve complete test coverage for essential user journeys.
- Integration tests for auth flows: Verify all authentication workflows with integration tests.
- E2E tests for payment processes: Include end-to-end tests for payment functionality.
- Load testing for API endpoints: Conduct performance testing on all API routes.

## Deployment Safety
- Zero-downtime deployment plan: Document strategy for deploying without service interruption.
- Rollback procedure documented: Maintain clear instructions for reverting deployments.
- Database migration safety: Ensure database changes are backward compatible.
- CDN configuration review: Verify content delivery network settings are optimized.
