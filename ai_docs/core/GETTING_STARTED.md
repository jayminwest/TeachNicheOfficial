# Getting Started with Teach Niche

This guide provides essential information for developers joining the Teach Niche project. It covers our core development philosophy, key standards, and how to get up and running quickly.

## Core Philosophy

Our development approach emphasizes:
- **Modularity**: Each component and service has a single, well-defined responsibility
- **Minimalism**: Keep dependencies minimal, code simple, and interfaces clean
- **Type Safety**: Leverage TypeScript for robust, maintainable code
- **Testing First**: Write tests before implementing features

## Development Environment Setup

### Prerequisites
- Node.js (v20+)
- npm (v9+) or yarn (v1.22+)
- Git (v2.30+)
- Docker (optional, for local service emulation)

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/teach-niche/platform.git
cd platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local` with your development credentials.

5. Start the development server:
```bash
npm run dev
```

## Project Structure

The project follows a modular structure:

- **app/**: Next.js application code
  - **api/**: API routes
  - **components/**: Reusable UI components
  - **lib/**: Utility functions and types
  - **services/**: Service modules for external integrations
    - **auth/**: Authentication services
    - **database/**: Database access services
    - **mux/**: Video processing services
  - **[routes]/**: Page components

## Key Development Standards

### TypeScript and Code Quality
- Use TypeScript for all code
- Follow strict ESLint configurations
- Avoid using "any" types
- Write self-documenting code with minimal comments
- Use the DatabaseResponse<T> pattern for consistent error handling
- Validate all data with Zod schemas
- Implement proper error handling with try/catch blocks
- NEVER use temporary workarounds or hardcoded data in production environments

### Component Development
- Use functional components with hooks
- Follow Atomic Design principles
- Prefer Shadcn UI components
- Ensure accessibility (WCAG compliance)
- Create custom hooks for reusable logic
- Implement proper loading states and error handling
- Use TypeScript interfaces for component props

### Testing
- Write tests before implementing features
- Place tests in `__tests__` directories adjacent to the code being tested
- Maintain 80% coverage minimum
- Use provided testing utilities
- Mock external dependencies consistently
- Test error handling scenarios
- Implement integration tests for API routes
- Test user flows end-to-end

### Data Management
- Initialize Supabase client in dedicated file
- Extend the DatabaseService class for specific data operations
- Implement the DatabaseResponse<T> pattern for consistent error handling
- Validate all data with Zod schemas
- Choose appropriate fetching strategy (SSR/CSR)
- Implement caching strategies where appropriate
- Write efficient queries with proper error handling
- NEVER use temporary data structures, mock data, or hardcoded values in production code

## Common Workflows

### Creating a New Feature
1. Create a feature branch from `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/your-feature-name
   ```
2. Implement with tests first
3. Run quality checks:
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```
4. Create a PR for review

### Fixing a Bug
1. Create a fix branch from `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b fix/bug-description
   ```
2. Add regression tests
3. Implement the fix
4. Run quality checks
5. Create a PR for review

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e

# Run visual tests
npm run test:visual
```

## Documentation

For more detailed information, refer to:

- Component Development: [standards/components.md](../standards/components.md)
- Testing Standards: [standards/testing.md](../standards/testing.md)
- Git Workflow: [standards/git.md](../standards/git.md)
- Security Requirements: [standards/security.md](../standards/security.md)
- API Standards: [standards/api.md](../standards/api.md)
- TypeScript Errors: [guides/development/TYPESCRIPT_ERRORS.md](../guides/development/TYPESCRIPT_ERRORS.md)

## Getting Help

If you need assistance:
1. Check the documentation first
2. Ask in the #dev-help Slack channel
3. Reach out to your team lead

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-02-24 | Documentation Team | Initial version |
| 1.1 | 2024-12-15 | Documentation Team | Updated prerequisites and testing instructions |
| 1.2 | 2025-03-05 | Documentation Team | Consolidated duplicate content and updated project structure |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
