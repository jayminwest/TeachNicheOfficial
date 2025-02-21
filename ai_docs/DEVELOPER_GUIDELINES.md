 # Teach Niche Developer Guide
 
 ## Core Philosophy
 
 Our development approach emphasizes:
 - **Modularity**: Each component and service has a single, well-defined responsibility
 - **Minimalism**: Keep dependencies minimal, code simple, and interfaces clean
 - **Type Safety**: Leverage TypeScript for robust, maintainable code
 - **Testing First**: Write tests before implementing features
 
https://github.com/muxinc/mux-node-sdk/blob/master/api.md
 
 ## 1. Coding Standards
 
 ### 1.1. Language and Frameworks
 
 - **TypeScript:**  All code must be written in TypeScript for type safety and improved code maintainability.
 - **React:**  Use React for building UI components. Follow React best practices, focusing on functional components and hooks for simpler state management.
 - **Next.js:**  Utilize Next.js framework conventions for routing, data fetching, and API routes. Embrace Next.js's features for efficient and minimal code.
 - **Shadcn UI:**  Leverage Shadcn UI components for a consistent and modern UI. Customize components judiciously, prioritizing minimalism and avoiding unnecessary complexity.
 
 ### 1.2. Code Style
 
 - **ESLint and Prettier:**  The project should be configured with ESLint and Prettier to enforce code style and formatting, ensuring clean and consistent code with minimal stylistic variations.
 - **Clean Code Principles:**  Write clean, readable, and well-documented code. Follow SOLID principles where applicable, but prioritize simplicity and avoid over-engineering.
 - **Comments:**  Add comments to explain complex logic, non-obvious code sections, and exported functions/components. Use Google style documentation, but strive for code that is self-explanatory and minimizes the need for extensive comments.
 - **Variable and Function Naming:**  Use descriptive and meaningful names for variables and functions. Follow camelCase convention. Keep names concise and to the point.
 - **Avoid Magic Numbers:**  Use constants for numerical values with specific meanings.
 - **Minimalism in Code:** Aim for the simplest solution that solves the problem. Avoid unnecessary abstractions or overly complex patterns when a simpler approach suffices.  **Keep it simple, and avoid "gold plating".**
 - DO NOT USE "any" types
 
 ### 1.3. React Specific Guidelines
 
 - **Functional Components:** Prefer functional components with hooks over class components for their inherent simplicity and readability.
 - **Component Reusability and Modularity:**  Design components to be highly reusable and composable, but also **modular**. Break down complex components into smaller, focused sub-components. Each component should have a single, well-defined responsibility.
 - **State Management:**  Use React's built-in `useState` and `useContext` hooks for local and global state management respectively. Favor simple state management solutions. Consider libraries like Zustand or Recoil only if absolutely necessary for complex state management needs, and always start with the simplest approach.
 - **Prop Types:**  Define prop types for all React components using TypeScript interfaces or types to ensure type safety and clear component interfaces. Keep prop interfaces minimal and only include necessary props.
 - **Avoid Inline Styles:**  Use CSS modules or Tailwind CSS classes for styling components to maintain separation of concerns and improve maintainability.
 - **Minimize Component Logic:** Keep component logic focused on rendering UI. Extract complex logic into custom hooks or utility functions to maintain component simplicity.
 
 ## 3. Component Development
 
 - **Atomic Design Principles (with Minimalism):** Consider using Atomic Design principles (Atoms, Molecules, Organisms, Templates, Pages) to structure components for better organization and reusability. However, apply these principles with minimalism in mind. Avoid creating unnecessary layers of abstraction if a simpler component structure suffices.
 - **Shadcn UI Usage:**  Prioritize using Shadcn UI components to reduce development effort and maintain design consistency. Customize only when necessary and keep customizations minimal. Avoid creating custom components if an existing Shadcn UI component can be adapted with minimal effort.
 - **Component Modularity:**  Strive for highly modular components. Break down complex UI elements into smaller, independent, and reusable components. This promotes maintainability and reduces code duplication.
 - **Component Documentation:**  For complex or reusable components, add comments explaining their purpose, props, and usage. Keep documentation concise and focused on essential information.
 - **Accessibility (A11y):**  Ensure all components are accessible by following WCAG guidelines. Use semantic HTML, ARIA attributes where necessary, and test with screen readers. Accessibility is a core principle, but implement it efficiently and avoid adding unnecessary complexity.
 
 ## 4. Data Fetching and Management (Supabase)
 
 - **Supabase Client:**  Initialize the Supabase client in a dedicated file (e.g., `src/supabase.ts`) and export it for use throughout the application. Keep Supabase client setup minimal and straightforward.
 - **Server-Side vs. Client-Side Fetching:**  Choose the appropriate data fetching strategy based on the data and performance requirements. Use server-side rendering (SSR) or static site generation (SSG) where possible for better performance and SEO. Client-side fetching (`useEffect`, `swr`, `react-query`) is suitable for dynamic data or -specific data.  Favor simpler data fetching methods when possible.
 - **Database Interactions:**  Use Supabase client methods for database interactions. Write efficient and minimal queries. Avoid fetching unnecessary data.
 - **Data Validation:**  Validate data received from the database and  inputs to prevent errors and security vulnerabilities. Keep validation logic simple and effective.
 
 
 ## 5. Authentication and Authorization (Supabase Auth)
 
 ### 5.1 User Authentication Implementation

 1. **Auth Context Setup**
    - Use the AuthContext provider from '@/app/services/auth/AuthContext'
    - Access auth state with the useAuth() hook which provides:
      - user: Current user object or null
      - loading: Boolean for auth state loading

 2. **Component Authentication**
    ```typescript
    import { useAuth } from "@/app/services/auth/AuthContext";
    
    function MyComponent() {
      const { user, loading } = useAuth();
      
      if (loading) return null; // Or loading indicator
      
      return user ? (
        <AuthenticatedContent />
      ) : (
        <UnauthenticatedContent />
      );
    }
    ```

 3. **Sign In/Sign Up Flow**
    - Use the provided SignInPage and SignUpPage components
    - Implement with Dialog component for modal presentation
    - Handle switching between sign in/sign up states
    
 4. **Sign Out**
    ```typescript
    await supabase.auth.signOut();
    window.location.href = '/'; // Redirect after signout
    ```

 ### 5.2 Route Protection
 - Use middleware or component-level checks with useAuth()
 - Redirect unauthenticated users to appropriate pages
 - Keep protection logic simple and consistent

 ### 5.3 Role-Based Access Control (RBAC)
 - Implement using Supabase RLS when needed
 - Use application-level checks based on user roles
 - Keep role implementation minimal
 
 ## 6. Payment Integration (Stripe Connect)
 
 - **Stripe API:**  Use the Stripe API for payment processing. Handle Stripe interactions securely, especially on the server-side (Edge Functions). Keep Stripe integration as straightforward as possible, leveraging Stripe's pre-built components and APIs. Version '2025-01-27.acacia'.
 - **Checkout Sessions:**  Implement Stripe Checkout Sessions for a streamlined payment experience. Use the simplest checkout flow that meets the requirements.
 - **Webhook Handling:**  Set up Stripe webhook handlers in Edge Functions to securely process payment confirmations and updates. Keep webhook handlers concise and focused on essential tasks.
 - **Error Handling:**  Implement proper error handling for payment failures and edge cases. Keep error handling simple and -friendly.
 - Stipe connect capabilities with creators able to recieive payouts easily
 
 ## 7. Video Handling (Vimeo)
 
 - Mux API for video uploading, streaming and analytics
 - Follow Mux SDK best practices for video handling
 - Implement proper error handling for upload/playback failures
 
 
 
 ## 8. Environment Variables and Secrets
 
 - **`.env.local` for local development:**  Store local development environment variables in `.env.local`. Keep the number of environment variables to a minimum.
 - **Environment Variables in Vercel:**  Configure environment variables in Vercel for production and staging environments.
 - **`.env.template`:**  Provide a `.env.template` file with placeholder variables for developers to easily set up their local environment. Keep the `.env.template` minimal and only include essential variables.
 
 ## 9. Testing Standards

 ### 9.1 Test Organization
 - Place test files in a `__tests__` directory next to the source files (e.g., `app/requests/__tests__/request-form.test.tsx` for `app/requests/request-form.tsx`)
 - Name test files with `.test.tsx` or `.test.ts` suffix
 - One test file per source file
 - All mocks are centralized in the `__mocks__` directory at the project root
   - Organized by service/feature (e.g., `__mocks__/services/auth.ts`)
   - Provides consistent mock data and interfaces across all tests
 - Every new function/component/feature MUST include at least one basic test case at creation time
   - Tests should verify core functionality before code review
   - Additional test cases can be added later
   - No PR will be accepted without accompanying tests

 ### 9.2 Testing Utilities
 We provide standard testing utilities to ensure consistency:

 - **test-utils.tsx**: Custom render function with provider wrappers
   - Use `render()` for basic component testing
   - Use `{ withAuth: true }` option when testing authenticated components
   - Customize provider props as needed

 - **setup/test-helpers.tsx**: Common testing patterns
   - Use `setup()` to get configured userEvent instance
   - Use `findByTextWithMarkup()` for complex text matching
   - Use `waitForLoadingToFinish()` for async operations

 - **setup/mocks.ts**: Standard mock objects
   - Use `createMockUser()` for consistent user data
   - Use `mockSupabaseClient` for Supabase operations

 ### 9.3 Test Structure
 Follow this pattern for component tests:
 ```typescript
 describe('ComponentName', () => {
   describe('rendering', () => {
     it('renders without crashing')
     it('renders expected elements')
   })

   describe('interactions', () => {
     it('handles user interactions')
   })

   describe('props', () => {
     it('handles all required props')
   })
 })
 ```

 ### 9.4 Testing Priorities
 1. **Critical Path Tests**
    - Authentication flows
    - Payment processes
    - Form submissions
    - Core user journeys

 2. **Component Tests**
    - Props validation
    - Rendering states
    - User interactions
    - Accessibility requirements

 3. **Hook Tests**
    - Initial state
    - State updates
    - Side effects
    - Error handling

 ### 9.5 Best Practices
 - Use Testing Library queries in this order:
   1. getByRole
   2. getByLabelText
   3. getByPlaceholderText
   4. getByText
   5. getByTestId (last resort)

 - Write user-centric tests that mirror actual usage
 - Test component behavior, not implementation
 - Use `userEvent` over `fireEvent`
 - Mock external dependencies consistently
 - Reset mocks between tests

 ### 9.6 Coverage Requirements
 - Minimum 80% coverage for:
   - Statements
   - Branches
   - Functions
   - Lines
 - 100% coverage for critical paths
 - Generate coverage reports in CI

 ### 9.7 Performance & Accessibility
 - Test component render performance
 - Include accessibility checks in component tests
 - Use axe-core for automated accessibility testing

 ### 9.8 Continuous Integration
 - All tests must pass before merge
 - Coverage reports generated on every PR
 - Performance benchmarks tracked over time
 
 ## 10. Security
 
 - Input validation using zod schemas
 - XSS prevention via React's built-in escaping
 - CSRF protection via Next.js defaults
 - API routes protected with proper auth middleware
 - Secure session handling via Supabase Auth
 
 ## 11. Error Handling & Monitoring
 
 - Use React Error Boundaries for UI errors
 - Consistent API error responses
 - Client-side error tracking via error monitoring service
 - Structured logging in production
 
 ## 12. Performance
 
 - Route-based code splitting
 - Image optimization via Next/Image
 - Bundle analysis in CI pipeline
 - Core Web Vitals monitoring
 
 ## 13. Documentation
 
 - **Code Comments:**  Write clear and concise comments in the code to explain complex logic and functionality.  Prioritize self-documenting code and minimize the need for comments.
 - **README.md:**  Maintain a comprehensive `README.md` file in the project root with project description, setup instructions, and other relevant information. Keep `README.md` concise and focused on essential information.
 - **`ai_docs/` directory:**  Use the `ai_docs/` directory for project planning documents, architecture diagrams, and other project-related documentation. Keep documentation in `ai_docs/` minimal and focused on high-level information.
 
 
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

 ## Git Branching Strategy

 ### Branch Structure
 ```
 main (production)
   ↳ staging (optional)
     ↳ dev
       ↳ feature/xyz
       ↳ bugfix/xyz
       ↳ hotfix/xyz
       ↳ release/v1.x.x
 ```

 ### Branch Types and Naming
 - `feature/` - For new features (e.g., feature/video-upload)
 - `bugfix/` - For non-critical bug fixes (e.g., bugfix/login-validation)
 - `hotfix/` - For critical production fixes (e.g., hotfix/security-patch)
 - `release/` - For release preparations (e.g., release/v1.2.0)

 ### Common Workflows

 #### Starting a New Feature
 ```bash
 git checkout dev
 git pull origin dev
 git checkout -b feature/your-feature-name
 ```

 #### Working on a Bug Fix
 ```bash
 git checkout dev
 git pull origin dev
 git checkout -b bugfix/bug-description
 ```

 #### Creating a Release
 ```bash
 git checkout dev
 git pull origin dev
 git checkout -b release/v1.0.0
 # Make version bumps and final adjustments
 ```

 #### Emergency Hotfix for Production
 ```bash
 git checkout main
 git pull origin main
 git checkout -b hotfix/critical-fix
 # After fix is complete and tested
 git checkout main
 git merge hotfix/critical-fix
 git checkout dev
 git merge hotfix/critical-fix
 ```

 ### Branch Protection Rules
 #### Main Branch
 - Require pull request reviews before merging
 - Require status checks to pass
 - Require linear history
 - Do not allow direct pushes

 #### Dev Branch
 - Require pull request reviews before merging
 - Require status checks to pass
 - Allow pull request merges

 ### Merging Strategy
 ```bash
 # When feature is complete
 git checkout dev
 git pull origin dev
 git merge feature/your-feature
 git push origin dev

 # When ready for release
 git checkout main
 git pull origin main
 git merge release/v1.0.0
 git tag -a v1.0.0 -m "Release version 1.0.0"
 git push origin main --tags
 ```

 ### Clean-up After Merging
 ```bash
 # Delete local branch
 git branch -d feature/your-feature

 # Delete remote branch
 git push origin --delete feature/your-feature
 ```
 
 ## Deployment
 
 - Preview deployments for all PRs
 - Production deploys require approval
 - Environment variables managed in Vercel
 - Zero-downtime deployments
 - Automated rollbacks on failure
 
 
 
 By adhering to these guidelines, with a strong focus on **modularity and minimalism**, we can ensure a consistent, maintainable, and high-quality codebase for the Teach Niche project.  These guidelines are living documents and should be updated as the project evolves and new best practices emerge, always keeping modularity and minimalism in mind.````
