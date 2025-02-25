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
- Node.js (v18+)
- npm or yarn
- Git
- Supabase CLI
- Vercel CLI (optional, for deployments)

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
cp .env.template .env.local
```

4. Configure your environment variables in `.env.local` with your development credentials.

5. Start the development server:
```bash
npm run dev
```

## Key Development Standards

### TypeScript and Code Quality
- Use TypeScript for all code
- Follow ESLint and Prettier configurations
- Avoid using "any" types
- Write self-documenting code with minimal comments

### Component Development
- Use functional components with hooks
- Follow Atomic Design principles
- Prefer Shadcn UI components
- Ensure accessibility (WCAG compliance)

### Testing
- Write tests before implementing features
- Place tests in `__tests__` directories
- Maintain 80% coverage minimum
- Use provided testing utilities

### Data Management
- Initialize Supabase client in dedicated file
- Validate all data with Zod
- Choose appropriate fetching strategy (SSR/CSR)
- Write efficient queries

## Common Workflows

### Creating a New Feature
1. Create a feature branch from `dev`
2. Implement with tests first
3. Run quality checks
4. Create a PR for review

### Fixing a Bug
1. Create a fix branch from `dev`
2. Add regression tests
3. Implement the fix
4. Create a PR for review

## Documentation

For more detailed information, refer to:

- Component Development: [standards/components.md](../standards/components.md)
- Testing Standards: [standards/testing.md](../standards/testing.md)
- Git Workflow: [standards/git.md](../standards/git.md)
- Security Requirements: [standards/security.md](../standards/security.md)
- API Standards: [standards/api.md](../standards/api.md)

## Getting Help

If you need assistance:
1. Check the documentation first
2. Ask in the #dev-help Slack channel
3. Reach out to your team lead

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
