# Branch-Specific AI Prompting

This document outlines different AI prompting configurations based on git branch names, aligned with the project's core philosophy of modularity, minimalism, type safety, and testing first.

## Production Branches

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

### staging
- Integration testing focus
  - Verify component integration tests
  - Check end-to-end user flows
  - Test cross-feature interactions
  - Validate data flow between services
- Environment-specific configurations
  - Review environment variable setup
  - Check service configuration differences
  - Verify proper API endpoint usage
  - Confirm proper auth configuration
- Deployment readiness checks
  - Verify build process
  - Check bundle size optimization
  - Review performance metrics
  - Confirm zero-downtime deployment capability

## Development Branches

### dev
- Code quality and testing focus
  - Enforce 80% minimum test coverage
  - Check for proper component test organization
  - Verify testing best practices implementation
  - Review mock usage consistency
- Integration considerations
  - Review component composition
  - Check service integration patterns
  - Verify state management approaches
  - Validate API integration patterns
- Performance optimization suggestions
  - Review React component optimization
  - Check for unnecessary re-renders
  - Verify proper data fetching strategies
  - Review image optimization usage

### feat/*
- Feature-specific guidance
  - Align with atomic design principles
  - Verify feature modularity
  - Check feature-specific test coverage
  - Review feature documentation
- Implementation suggestions
  - Recommend appropriate Shadcn UI components
  - Suggest optimal state management approaches
  - Propose efficient data fetching strategies
  - Guide proper error handling implementation
- Component reuse opportunities
  - Identify reusable component patterns
  - Suggest shared hook opportunities
  - Review utility function potential
  - Check for duplicate functionality
- Testing strategy recommendations
  - Suggest critical test cases
  - Guide integration test setup
  - Recommend edge case coverage
  - Propose accessibility testing approach

### fix/*
- Bug analysis assistance
  - Review error patterns
  - Check related components
  - Analyze data flow
  - Verify error boundaries
- Regression testing suggestions
  - Identify affected features
  - Suggest test cases
  - Review edge cases
  - Check cross-browser compatibility
- Root cause analysis
  - Examine error patterns
  - Review component lifecycle
  - Check state management
  - Verify data validation
- Similar bug pattern detection
  - Identify similar components
  - Review related functionality
  - Check for pattern repetition
  - Suggest preventive measures

### refactor/*
- Code improvement suggestions
  - Identify complexity reduction opportunities
  - Suggest component splitting
  - Review prop drilling solutions
  - Recommend performance improvements
- Architecture optimization
  - Review component hierarchy
  - Check service organization
  - Verify state management patterns
  - Analyze data flow patterns
- Technical debt identification
  - Flag repeated code patterns
  - Identify outdated practices
  - Review deprecated usage
  - Check for optimization opportunities

### docs/*
- Documentation completeness checks
  - Verify component documentation
  - Check API documentation
  - Review setup instructions
  - Confirm environment variable documentation
- API documentation verification
  - Check endpoint documentation
  - Verify response types
  - Review error documentation
  - Confirm authentication details
- Example code validation
  - Review code snippets
  - Check example accuracy
  - Verify setup instructions
  - Validate configuration examples
- Writing documentation MADE FOR aider
  - Focus on AI-readable formatting
  - Include clear code references
  - Maintain consistent structure
  - Provide context for AI analysis

### test/*
- Test coverage analysis
  - Review coverage metrics
  - Identify coverage gaps
  - Check critical path testing
  - Verify edge case coverage
- Test case suggestions
  - Recommend component tests
  - Suggest integration tests
  - Propose edge cases
  - Guide accessibility testing
- Edge case identification
  - Review error conditions
  - Check boundary cases
  - Analyze user interactions
  - Verify data validation
