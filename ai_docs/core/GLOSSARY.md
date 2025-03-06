# Glossary

This document defines key terminology used throughout the Teach Niche platform and documentation.

## A

### Access Control
The system that manages permissions and restrictions for users accessing different parts of the platform.

### Analytics
Data collection and analysis of user behavior, content performance, and business metrics.

### API (Application Programming Interface)
A set of defined rules that allow different applications to communicate with each other.

### API Route
In Next.js, a serverless function endpoint defined in the `/app/api/` directory that handles HTTP requests.

## B

### Backend
The server-side of the application that handles data processing, business logic, and database operations.

### Billing Cycle
The recurring period for subscription payments (monthly, annually, etc.).

## C

### CDN (Content Delivery Network)
A distributed network of servers that delivers content to users based on their geographic location.

### Creator
A user who creates and publishes educational content on the platform.

### Conversion Rate
The percentage of users who complete a desired action (e.g., sign up, purchase).

### Component
A reusable UI element built with React, typically found in the `/app/components/` directory.

## D

### Dashboard
The interface where users manage their account, content, and view analytics.

### Database
The structured storage system that holds all persistent data for the application.

### DatabaseService
A base class for database operations that provides common functionality for derived services. Implements retry logic, error handling, and returns a consistent DatabaseResponse<T> interface with data, error, and success properties.

## E

### E2E Testing
End-to-End testing that verifies complete user journeys through the application, typically using tools like Playwright.

### Engagement
Metrics that measure how users interact with content (views, completion rate, etc.).

### Environment
A specific instance of the application (development, staging, production).

## F

### Frontend
The client-side of the application that users interact with directly.

### Feature Flag
A technique that allows features to be enabled or disabled without deploying new code.

## L

### Learner
A user who consumes educational content on the platform.

### Lesson
A single unit of educational content, typically a video with supporting materials.

### LessonsService
A service class that extends DatabaseService and handles database operations related to lessons, including creation, retrieval, updating, and deletion of lesson records.

## M

### Metadata
Descriptive information about content (title, description, tags, etc.).

### Monetization
The process of generating revenue from content.

### Mux
The video hosting and streaming service used by Teach Niche.

## N

### Next.js
The React framework used to build the Teach Niche platform.

## P

### Payout
The transfer of earnings from the platform to a creator.

### Platform Fee
The percentage or fixed amount that the platform charges for each transaction.

### Playwright
An end-to-end testing framework used to automate browser testing across Chromium, Firefox, and WebKit.

### PurchasesService
A service class that extends DatabaseService and handles database operations related to purchases, including creation, verification, and status updates of purchase records.

## R

### Retention
The ability to keep users engaged and returning to the platform over time.

### Role
A set of permissions assigned to users based on their function (admin, creator, learner).

### Row-Level Security (RLS)
A PostgreSQL feature used in Supabase to control access to row data based on the user making the request.

## S

### SSR (Server-Side Rendering)
A technique where pages are rendered on the server before being sent to the client.

### Stripe
The payment processing service used by Teach Niche.

### Supabase
The backend-as-a-service platform providing database, authentication, and storage for Teach Niche.

### Subscription
A recurring payment model where users pay regularly for access to content.

## T

### TDD (Test-Driven Development)
A software development approach where tests are written before the code implementation.

### Type Safety
The extent to which a programming language prevents type errors. In TypeScript, this means ensuring variables and functions use consistent types throughout the codebase.

### Transaction
A financial exchange between users and the platform or between users.

### Two-Factor Authentication (2FA)
An additional security layer requiring users to provide two forms of identification.

## U

### User Journey
The path a user takes through the platform, from discovery to conversion and beyond.

### UX (User Experience)
The overall experience a user has when interacting with the platform.

## V

### Video Encoding
The process of converting video files into formats optimized for streaming.

### Viewport
The visible area of a web page in a browser window.

## W

### Webhook
An HTTP callback that occurs when a specific event happens in a system.

### Workflow
A defined sequence of steps to complete a process in the platform.

## Z

### Zod
A TypeScript-first schema validation library used to validate data throughout the application. Provides both runtime validation and static type inference, ensuring data consistency and type safety.

---

This glossary will be updated regularly as new terms are introduced or existing definitions need clarification.

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-02-24 | Documentation Team | Initial version |
| 1.1 | 2025-03-05 | Documentation Team | Added project-specific terms and updated definitions |
