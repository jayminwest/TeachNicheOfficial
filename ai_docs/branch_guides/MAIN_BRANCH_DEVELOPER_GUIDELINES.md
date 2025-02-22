# Main Branch Developer Guidelines

These guidelines supplement the core DEVELOPER_GUIDELINES.md with additional requirements specific to main branch development and reviews.

## Production Branch Focus Areas

### main
- Strict code review focus
  - Type safety verification across component interfaces
  - Verify proper error handling and user feedback
  - Ensure all props are properly typed
  - Validate component composition patterns
  - Review hook dependencies and cleanup
  - Check for proper React key usage
  - Verify state management patterns
- Security and stability checks
  - Review authentication flows
  - Verify Supabase RLS policies
  - Check for proper input validation using zod schemas
  - Audit API route protection
  - Review CORS configurations
  - Validate file upload restrictions
  - Check rate limiting implementation
  - Verify proper session handling
- Production readiness verification
  - Confirm all environment variables are properly configured
  - Verify Stripe integration completeness
  - Check Mux video handling robustness
  - Review accessibility compliance
  - Validate error boundary implementation
  - Check loading state handling
  - Review performance optimizations
  - Verify proper image optimization
  - Test responsive design implementation
- Documentation completeness checks
  - Verify JSDoc comments on exported functions
  - Ensure README updates for new features
  - Check for updated environment variable documentation
  - Confirm API documentation accuracy
  - Review component prop documentation
  - Validate test coverage documentation
  - Check deployment procedure updates
  - Verify changelog entries

## Additional Requirements

### Testing Standards
- 100% test coverage for critical paths
- Integration tests for auth flows
- E2E tests for payment processes
- Accessibility testing results
- Performance benchmark results
- Load testing for API endpoints

### Performance Requirements
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Bundle size analysis results
- No memory leaks in React components
- Efficient data fetching patterns

### Security Checklist
- OWASP Top 10 compliance
- CSP headers configured
- Auth token handling review
- API rate limiting
- Input sanitization
- File upload restrictions
- Proper error messages (no leaks)

### Deployment Verification
- Zero-downtime deployment plan
- Rollback procedure documented
- Database migration safety
- Environment variable validation
- CDN configuration review
- Monitoring setup verification
