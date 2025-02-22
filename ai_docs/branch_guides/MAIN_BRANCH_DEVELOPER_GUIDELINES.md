# Main Branch Developer Guidelines

## Production Branch Focus Areas

### main
- Strict code review focus
  - Type safety verification across component interfaces
  - Verify proper error handling and user feedback
  - Ensure all props are properly typed
- Security and stability checks
  - Review authentication flows
  - Verify Supabase RLS policies
  - Check for proper input validation using zod schemas
  - Audit API route protection
- Production readiness verification
  - Confirm all environment variables are properly configured
  - Verify Stripe integration completeness
  - Check Mux video handling robustness
  - Review accessibility compliance
- Documentation completeness checks
  - Verify JSDoc comments on exported functions
  - Ensure README updates for new features
  - Check for updated environment variable documentation
  - Confirm API documentation accuracy
