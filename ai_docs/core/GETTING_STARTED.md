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
- Follow strict ESLint configurations
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
1. Create a feature branch from `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/your-feature-name
   ```
2. Implement with tests first
3. Run quality checks
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
# Getting Started

This guide will help you set up your development environment and get started with the Teach Niche platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** (v9 or later) or **yarn** (v1.22 or later)
- **Git** (v2.30 or later)
- **Docker** (optional, for local service emulation)

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/teach-niche.git
cd teach-niche
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` to add your local configuration values.

### 4. Set Up Local Services

#### Option A: Use Remote Development Services

For team members with access to development environments:

1. Request access credentials from the DevOps team
2. Add the provided credentials to your `.env.local` file

#### Option B: Use Local Docker Services

For completely local development:

```bash
docker-compose up -d
```

This will start local instances of:
- PostgreSQL database
- Minio (S3-compatible storage)
- Mailhog (SMTP testing)

### 5. Initialize the Database

```bash
npm run db:migrate
npm run db:seed
# or
yarn db:migrate
yarn db:seed
```

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the project structure.

## Development Workflow

1. Create a new branch for your feature or fix:
   ```bash
   # For features
   git checkout -b feature/descriptive-feature-name

   # For bug fixes
   git checkout -b fix/descriptive-bug-fix

   # For documentation updates
   git checkout -b docs/what-youre-documenting

   # For refactoring
   git checkout -b refactor/what-youre-refactoring
   ```
2. Make your changes, following the coding standards
3. Write tests for your changes
4. Run the test suite to ensure everything passes
5. Submit a pull request for review

For more details, see [WORKFLOW.md](../guides/development/WORKFLOW.md).

## Common Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern=components

# Run tests in watch mode
npm test -- --watch
```

### Building for Production

```bash
npm run build
# or
yarn build
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Getting Help

- Check the documentation in the `ai_docs` directory
- Ask questions in the team Slack channel
- For bugs, create an issue in the issue tracker

## Next Steps

- Review the [Core Documentation](./OVERVIEW.md) to understand the project
- Explore the [Guides](../guides) for detailed instructions on specific topics
- Familiarize yourself with the [Standards](../standards) for code quality and best practices
