 # Teach Niche Developer Guide
 
 ## Core Philosophy
 
 Our development approach emphasizes:
 - **Modularity**: Each component and service has a single, well-defined responsibility
 - **Minimalism**: Keep dependencies minimal, code simple, and interfaces clean
 - **Type Safety**: Leverage TypeScript for robust, maintainable code
 - **Testing First**: Write tests before implementing features
 
 
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
 
 - **Supabase Auth Client:**  Utilize Supabase Auth client for  authentication (login, logout, session management). Keep authentication implementation minimal and rely on Supabase Auth's built-in features as much as possible.
 - **Route Protection:**  Implement route protection using middleware or component-level checks to ensure only authenticated s can access protected pages. Keep route protection logic simple and efficient.
 - **Role-Based Access Control (RBAC):** If necessary, implement RBAC using Supabase's Row Level Security (RLS) or application-level checks to control access to specific features or data based on  roles. Implement RBAC only when truly needed and keep the implementation as simple as possible.
 
 ## 6. Payment Integration (Stripe Connect)
 
 - **Stripe API:**  Use the Stripe API for payment processing. Handle Stripe interactions securely, especially on the server-side (Edge Functions). Keep Stripe integration as straightforward as possible, leveraging Stripe's pre-built components and APIs.
 - **Checkout Sessions:**  Implement Stripe Checkout Sessions for a streamlined payment experience. Use the simplest checkout flow that meets the requirements.
 - **Webhook Handling:**  Set up Stripe webhook handlers in Edge Functions to securely process payment confirmations and updates. Keep webhook handlers concise and focused on essential tasks.
 - **Error Handling:**  Implement proper error handling for payment failures and edge cases. Keep error handling simple and -friendly.
 - Stipe connect capabilities with creators able to recieive payouts easily
 
 ## 7. Video Handling (Vimeo)
 
 - Vimeo API for video uploading, editing, etc. 
 
 
 
 ## 8. Environment Variables and Secrets
 
 - **`.env.local` for local development:**  Store local development environment variables in `.env.local`. Keep the number of environment variables to a minimum.
 - **Environment Variables in Vercel:**  Configure environment variables in Vercel for production and staging environments.
 - **`.env.template`:**  Provide a `.env.template` file with placeholder variables for developers to easily set up their local environment. Keep the `.env.template` minimal and only include essential variables.
 
 ## 9. Testing Standards

 ### 9.1 Test Organization
 - Place test files in `__tests__` directories adjacent to the code being tested
 - Name test files with `.test.tsx` or `.test.ts` suffix
 - Mirror the source file structure in test directories
 - One test file per source file

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
 
 ## 12. Documentation
 
 - **Code Comments:**  Write clear and concise comments in the code to explain complex logic and functionality.  Prioritize self-documenting code and minimize the need for comments.
 - **README.md:**  Maintain a comprehensive `README.md` file in the project root with project description, setup instructions, and other relevant information. Keep `README.md` concise and focused on essential information.
 - **`ai_docs/` directory:**  Use the `ai_docs/` directory for project planning documents, architecture diagrams, and other project-related documentation. Keep documentation in `ai_docs/` minimal and focused on high-level information.
 
 
 ## Architecture
 
 ### Project Structure
 ```
 /app
 ├── components/   # Reusable UI components
 ├── lib/         # Pure utility functions and types
 ├── hooks/       # Shared React hooks
 ├── api/         # API route handlers
 └── services/    # External service integrations
 ```
 
 ## Deployment
 
 - Vercel Standards Go here
 
 
 
 By adhering to these guidelines, with a strong focus on **modularity and minimalism**, we can ensure a consistent, maintainable, and high-quality codebase for the Teach Niche project.  These guidelines are living documents and should be updated as the project evolves and new best practices emerge, always keeping modularity and minimalism in mind.````
