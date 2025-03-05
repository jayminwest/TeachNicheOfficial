# Issue: Update AI Documentation to Reflect Production Status and Codebase Patterns

## Description
The `ai_docs/` directory needs a comprehensive update to accurately reflect the current state of the Teach Niche platform. The existing documentation treats the project as hypothetical or in-development, when it is actually a live production application with active users. This disconnect creates challenges for development tools like Aider that rely on accurate documentation to understand the codebase.

## Technical Analysis
After reviewing the codebase, we've identified several key areas where documentation needs to be updated:

1. **Project Status**: Documentation should clearly state this is a production application with real users, not a future implementation.

2. **Tech Stack Reality**: The actual tech stack in use includes:
   - Next.js 15.1.7 with App Router
   - React 19.0.0
   - TypeScript with strict null checks
   - Supabase for authentication and database
   - Mux for video processing and playback
   - Stripe Connect for payments (using API version 2025-01-27.acacia)
   - Shadcn UI components
   - Jest and Playwright for testing

3. **Component Patterns**: The codebase follows specific patterns for components:
   - Client components are marked with "use client" directive
   - Props interfaces are defined at the top of component files
   - Components use the function declaration style
   - Optional props are consistently marked with `?` in TypeScript interfaces
   - Components use the `cn()` utility for className composition

4. **API Route Patterns**: API routes follow consistent patterns:
   - Organized by feature in the `app/api/` directory
   - Use NextResponse for standardized response formatting
   - Implement proper error handling with status codes
   - Follow RESTful conventions with HTTP methods
   - Use Supabase client for database operations

5. **Authentication Flow**: The authentication system uses:
   - Supabase Auth with route handlers
   - OAuth providers (Google)
   - Session-based authentication
   - Protected routes and content

6. **Database Access**: Database operations follow patterns:
   - Type-safe database access with generated types
   - Row-level security (RLS) for data protection
   - Consistent error handling for database operations

7. **Testing Strategy**: The project uses:
   - Jest for unit and integration tests
   - Playwright for end-to-end and visual regression tests
   - Mock implementations for external services

## Affected Files
The entire `ai_docs/` directory needs review, with particular focus on:
- `ai_docs/core/ARCHITECTURE.md`
- `ai_docs/core/OVERVIEW.md`
- `ai_docs/core/DOCUMENTATION_USAGE.md`
- Any files describing component patterns, API patterns, and data flow

## Proposed Changes
1. Update all documentation to clearly state this is a production application with real users
2. Document the actual component patterns used (based on files like `app/components/ui/video-player.tsx`)
3. Document the TypeScript interface patterns (e.g., consistent use of optional properties)
4. Document the API route patterns (based on `app/api/lessons/route.ts`)
5. Document the authentication flows (based on `app/api/auth/callback/route.ts`)
6. Document the error handling patterns
7. Document the testing approach (based on `app/api/__tests__/requests.test.ts`)
8. Create new documentation files for areas not currently covered

## Implementation Plan
1. First, update core documentation files to reflect production status
2. Create or update pattern documentation for components, API routes, and hooks
3. Document database access patterns and type safety approach
4. Document testing strategy and patterns
5. Create a comprehensive guide for AI tools like Aider to understand the codebase

## Testing Requirements
- Documentation should be reviewed for accuracy against the actual codebase
- Documentation should be tested with Aider to ensure it improves code understanding
- No functional testing required as this is a documentation-only change

## Additional Context
This documentation update is critical for maintaining the codebase effectively as it grows. Accurate documentation will:
1. Help new developers understand the established patterns
2. Ensure consistency in future development
3. Improve AI tool effectiveness when working with the codebase
4. Reduce the risk of introducing inconsistencies or bugs

The current tech stack as seen in package.json includes React 19, Next.js 15, and other cutting-edge dependencies, indicating this is an actively maintained production application.

## Labels
- documentation
- enhancement
- high priority

## Acceptance Criteria
- All documentation accurately reflects the production status of the application
- Component patterns are clearly documented with examples
- API route patterns are clearly documented with examples
- Authentication flow is accurately described
- Database access patterns are documented
- Testing approach is documented
- AI tools like Aider can effectively understand the codebase structure
