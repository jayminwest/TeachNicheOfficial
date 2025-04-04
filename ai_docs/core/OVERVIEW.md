# Teach Niche Project Overview

## Vision

Teach Niche is a platform designed to connect expert instructors with students seeking specialized knowledge in niche subjects. Our vision is to democratize access to expert instruction in specialized fields that are often underserved by traditional educational platforms.

## Mission

To create a seamless, secure, and engaging platform that:
- Enables experts to monetize their specialized knowledge
- Provides learners with high-quality, accessible instruction in niche subjects
- Fosters communities around specialized interests and skills

## Core Philosophy

Our development approach emphasizes:

- **Modularity**: Each component and service has a single, well-defined responsibility
- **Minimalism**: Keep dependencies minimal, code simple, and interfaces clean
- **Type Safety**: Leverage TypeScript for robust, maintainable code with zero type errors
- **Testing First**: Write tests before implementing features, including end-to-end tests
- **Security**: Security is a fundamental consideration in all aspects of development
- **Consistency**: Follow established patterns and practices
- **Documentation**: Comprehensive documentation is essential for maintainability
- **Complete Test Coverage**: Ensure all user journeys are tested with Jest and Playwright
- **Error Handling**: Consistent error handling patterns with the DatabaseResponse pattern
- **Data Validation**: Schema validation with Zod throughout the application
- **Caching Strategies**: Appropriate caching for performance optimization
- **Production Quality**: NEVER use temporary workarounds, mock data, or hardcoded values in production environments

## Project Goals

1. Create a robust, secure platform that connects kendama enthusiasts with players
2. Establish a maintainable codebase that can evolve over time
3. Build with security and privacy as fundamental requirements
4. Ensure accessibility and inclusivity for all users
5. Deliver a high-quality user experience
6. Enable creators to monetize their expertise
7. Provide interactive learning opportunities
8. Maintain production environment integrity by NEVER allowing temporary workarounds or test data

## Core Values

- **Expertise**: Valuing and promoting deep, specialized knowledge
- **Accessibility**: Making specialized instruction available to all
- **Quality**: Maintaining high standards for all content
- **Community**: Building connections between experts and learners
- **Innovation**: Continuously improving the learning experience

## Target Audience

### Instructors
- Subject matter experts with specialized knowledge
- Content creators looking to monetize their expertise
- Professionals seeking to share their skills

### Learners
- Enthusiasts seeking to deepen knowledge in specific areas
- Professionals looking to acquire specialized skills
- Hobbyists wanting to learn from recognized experts

## Key Features

- Secure, high-quality video lesson hosting
- Flexible pricing models for instructors
- Robust content discovery system
- Community engagement tools
- Integrated payment processing with instructor payouts
- Analytics for instructors to track performance

## Key Stakeholders

- Development Team: Responsible for implementation
- Product Management: Defines product requirements
- Security Team: Ensures security standards are met
- Quality Assurance: Verifies quality standards
- Operations: Manages deployment and infrastructure
- Content Creators: Provide educational content
- End Users: Kendama enthusiasts learning from the platform

## Technology Stack

- **Frontend**: Next.js v15.1.7, React v19.0.0, TypeScript, Shadcn UI
- **Backend**: Next.js API routes, Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth v0.10.0
- **Payments**: Stripe Connect v17.6.0 (API version: 2025-01-27.acacia)
- **Video**: Mux Video v9.0.1
- **Testing**: Jest v29.7.0, Playwright v1.50.1, Testing Library v16.2.0
- **Deployment**: Vercel

## Documentation Structure

Our documentation is organized into several key sections:

- **Core**: Fundamental project information
- **Guides**: Step-by-step instructions for common tasks
- **Standards**: Best practices and requirements
- **Processes**: Workflows for recurring activities
- **Reference**: Detailed technical information
- **Templates**: Standardized document formats

## Getting Started

New team members should:

1. Read the core documentation to understand the project
2. Review the standards documentation to understand our practices
3. Follow the development setup guide to configure their environment
4. Consult the workflow guide to understand our development process

## Communication Channels

- Project Management: GitHub Projects
- Code Repository: GitHub
- Documentation: ai_docs/ directory
- Team Communication: Slack
- Issue Tracking: GitHub Issues

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2024-02-24 | Documentation Team | Initial version |
| 1.1 | 2024-02-24 | Documentation Team | Updated as part of documentation restructuring |
| 1.2 | 2024-02-25 | Documentation Team | Consolidated duplicate overview sections |
| 1.3 | 2025-03-05 | Documentation Team | Updated technology stack versions and aligned with current implementation |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
