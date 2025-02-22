# Teach Niche Developer Guide

## Core Philosophy

Our development approach emphasizes:
- **Modularity**: Each component and service has a single, well-defined responsibility
- **Minimalism**: Keep dependencies minimal, code simple, and interfaces clean
- **Type Safety**: Leverage TypeScript for robust, maintainable code
- **Testing First**: Write tests before implementing features

## Quick Reference

This guide provides high-level guidelines. For detailed standards, refer to:

- Component Development: [ai_docs/standards/components.md](ai_docs/standards/components.md)
- Testing Standards: [ai_docs/standards/testing.md](ai_docs/standards/testing.md)
- Git Workflow: [ai_docs/standards/git.md](ai_docs/standards/git.md)
- Security Requirements: [ai_docs/standards/security.md](ai_docs/standards/security.md)
- API Standards: [ai_docs/standards/api.md](ai_docs/standards/api.md)

 
## 1. Coding Standards

### 1.1. Language and Frameworks
- **TypeScript:** All code must be written in TypeScript for type safety
- **React:** Use functional components and hooks
- **Next.js:** Follow app router conventions
- **Shadcn UI:** Use for consistent UI components

For detailed coding standards, see [ai_docs/standards/code.md](ai_docs/standards/code.md)
 
### 1.2. Code Style
- Use ESLint and Prettier for consistent formatting
- Follow clean code principles but prioritize simplicity
- Write self-documenting code with minimal comments
- Use descriptive names in camelCase
- Avoid magic numbers with constants
- Never use "any" types

For detailed style guide, see [ai_docs/standards/style.md](ai_docs/standards/style.md)
 
### 1.3. React Guidelines
- Use functional components with hooks
- Keep components modular and focused
- Use built-in state management when possible
- Define prop types with TypeScript
- Use Tailwind CSS for styling
- Extract complex logic to custom hooks

For detailed React guidelines, see [ai_docs/standards/react.md](ai_docs/standards/react.md)
 
## 2. Component Development

For detailed component development guidelines including Atomic Design principles, Shadcn UI usage, accessibility requirements, and documentation standards, see [ai_docs/standards/components.md](ai_docs/standards/components.md)

Key principles:
- Use Atomic Design with minimalism
- Prefer Shadcn UI components
- Keep components small and focused
- Document complex components
- Ensure accessibility (WCAG)
 
## 3. Data Management

For detailed data management guidelines including Supabase setup, fetching strategies, and validation requirements, see [ai_docs/standards/data.md](ai_docs/standards/data.md)

Key principles:
- Initialize Supabase client in dedicated file
- Choose appropriate fetching strategy (SSR/CSR)
- Write efficient queries
- Validate all data with Zod
 
 
## 4. Authentication

For detailed authentication implementation guidelines including AuthContext setup, route protection, and RBAC, see [ai_docs/standards/auth.md](ai_docs/standards/auth.md)

Key principles:
- Use AuthContext provider and useAuth() hook
- Implement proper route protection
- Follow RBAC best practices
- Keep auth logic simple and consistent

Example usage:
```typescript
const { user, loading } = useAuth();
if (!user) return <SignInPage />;
```
 
## 5. External Services

### 5.1 Stripe Connect (v2025-01-27.acacia)
For detailed payment integration guidelines, see [ai_docs/standards/payments.md](ai_docs/standards/payments.md)

Key principles:
- Use pre-built Stripe components
- Handle webhooks in Edge Functions
- Implement proper error handling
- Enable creator payouts

### 5.2 Mux Video
For detailed video handling guidelines, see [ai_docs/standards/video.md](ai_docs/standards/video.md)

Key principles:
- Follow SDK best practices
- Handle upload/playback errors
- Implement proper analytics
 
 
 
## 6. Environment & Deployment

### 6.1 Environment Variables
For detailed environment configuration guidelines, see [ai_docs/standards/env.md](ai_docs/standards/env.md)

Key principles:
- Use .env for local development
- Configure in Vercel for production
- Provide .env.template
 
## 7. Testing

For detailed testing guidelines including organization, utilities, structure, and best practices, see [ai_docs/standards/testing.md](ai_docs/standards/testing.md)

Key principles:
- Place tests in `__tests__` directories
- Use provided testing utilities
- Follow standard test structure
- Maintain 80% coverage minimum
- Include accessibility testing
- Run tests in CI pipeline

Example test structure:
```typescript
describe('ComponentName', () => {
  it('renders and behaves as expected', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```
 
## 8. Security & Error Handling

For detailed security guidelines and error handling strategies, see [ai_docs/standards/security.md](ai_docs/standards/security.md)

Key principles:
- Validate all inputs with Zod
- Protect API routes with auth middleware
- Use Error Boundaries for UI errors
- Implement structured error logging

## 9. Performance

For detailed performance optimization guidelines, see [ai_docs/standards/performance.md](ai_docs/standards/performance.md)

Key principles:
- Use route-based code splitting
- Optimize images with Next/Image
- Monitor Core Web Vitals
- Run bundle analysis in CI
 
## 10. Documentation

For detailed documentation standards, see [ai_docs/standards/docs.md](ai_docs/standards/docs.md)

Key principles:
- Write clear, minimal code comments
- Maintain comprehensive README.md
- Keep ai_docs/ focused and up-to-date
 
 
 ## Architecture
 
### Project Structure

The project follows Next.js 13+ app router conventions with a clear separation of concerns:

```
/app
├── api/                  # API route handlers
│   ├── checkout/        # Payment/checkout endpoints
│   ├── lessons/         # Lesson management
│   ├── mux/            # Video service integration
│   ├── requests/       # Lesson requests
│   ├── stripe/         # Payment processing
│   ├── video/          # Video handling
│   └── webhooks/       # External service webhooks
├── components/          # Shared components
│   ├── providers.tsx   # App-wide providers
│   └── ui/             # Reusable UI components
│       └── __tests__/  # Component tests
├── dashboard/          # Dashboard feature
│   ├── components/     # Dashboard-specific components
│   └── page.tsx       # Dashboard page
├── lessons/           # Lesson management
│   ├── [id]/         # Individual lesson pages
│   ├── new/          # New lesson creation
│   └── page.tsx      # Lessons list page
├── lib/              # Shared utilities
│   ├── schemas/      # Data validation schemas
│   ├── supabase/    # Database utilities
│   └── utils.ts     # General utilities
├── profile/         # User profile feature
│   ├── components/  # Profile-specific components
│   └── page.tsx    # Profile page
├── requests/        # Lesson requests feature
│   ├── components/  # Request-specific components
│   │   └── __tests__/ # Request component tests
│   └── page.tsx    # Requests page
└── services/       # External service integrations
    ├── auth/       # Authentication
    ├── mux.ts      # Video service
    ├── stripe.ts   # Payment processing
    └── supabase.ts # Database client
```

Key organizational principles:

1. **Feature-based Organization**
   - Major features have dedicated directories (dashboard, lessons, profile, requests)
   - Each feature directory contains its specific components and pages

2. **Component Organization**
   - Shared UI components in /components/ui
   - Feature-specific components co-located with their features
   - Tests co-located with components in __tests__ directories

3. **API Routes**
   - Grouped by feature/service
   - Clear separation of concerns (auth, video, payments, etc.)
   - Webhook handlers isolated in /api/webhooks

4. **Services & Utilities**
   - External service integrations in /services
   - Shared utilities and schemas in /lib
   - Database utilities separated in /lib/supabase

5. **Testing Structure**
   - Tests co-located with components
   - Consistent naming convention (*.test.tsx)
   - Shared test utilities in project root /__mocks__

This structure promotes:
- Clear separation of concerns
- Easy feature location and navigation
- Scalable organization for new features
- Consistent testing approach
- Modular component development

## 11. Version Control

For detailed Git workflow guidelines including branching strategy, protection rules, and merging practices, see [ai_docs/standards/git.md](ai_docs/standards/git.md)


Key principles:
- Follow trunk-based development
- Use feature branches for changes
- Require PR reviews
- Keep branches short-lived
 
 ## Deployment
 
 - Preview deployments for all PRs
 - Production deploys require approval
 - Environment variables managed in Vercel
 - Zero-downtime deployments
 - Automated rollbacks on failure
 
 
 
 By adhering to these guidelines, with a strong focus on **modularity and minimalism**, we can ensure a consistent, maintainable, and high-quality codebase for the Teach Niche project.  These guidelines are living documents and should be updated as the project evolves and new best practices emerge, always keeping modularity and minimalism in mind.````
