# Documentation Usage Guide

This guide outlines how to effectively use project documentation.

## Finding Documentation

When working on a task, follow these steps:

1. **IDENTIFY** the type of task you're working on:
   - Feature development
   - Bug fix
   - Refactoring
   - Documentation update

2. **REQUEST** relevant documentation:
   - Ask: "Can you show me documentation about [specific topic]?"
   - Example: "Can you show me documentation about API principles?"

3. **REFERENCE** specific sections:
   - For standards: "What are our standards for [specific area]?"
   - For processes: "What's our process for [specific workflow]?"

4. **APPLY** documentation appropriately:
   - Follow established patterns
   - Adhere to coding standards
   - Maintain documentation format

## When to Request Documentation

Request documentation when:
- Starting work in an unfamiliar area
- Implementing a new feature
- Fixing a complex bug
- Ensuring compliance with project standards
- Needing clarification on project architecture
- Working with payment or payout systems
- Encountering TypeScript errors (see [TYPESCRIPT_ERRORS.md](../guides/development/TYPESCRIPT_ERRORS.md))

## Documentation-First and Test-Driven Approach

For complex tasks:
1. First, understand relevant documentation
2. Create a dedicated branch for your work from dev:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/your-feature-name dev
   # or
   git checkout -b fix/your-fix-description dev
   ```
3. Plan changes according to established patterns
4. Write tests before implementing any code (TDD)
   - Start with basic unit and component tests
   - Add integration tests for component interactions
   - Include end-to-end tests with Playwright that verify third-party API integrations
5. Implement following documented standards
6. Ensure all tests pass
7. Update documentation if necessary

## Documentation Maintenance

When you find outdated or incorrect information:
1. Identify the specific issue
2. Create a documentation branch from dev:
   ```bash
   git checkout dev
   git pull
   git checkout -b docs/update-description dev
   ```
3. Propose a clear update
4. Submit through the established documentation update process
5. Reference any related code changes

## Effective Documentation Practices

1. **Be Concise**: Keep documentation clear and to the point
2. **Use Examples**: Include practical code examples
3. **Maintain Structure**: Follow the established documentation structure
4. **Cross-Reference**: Link to related documentation
5. **Keep Updated**: Update documentation when implementing changes

This approach allows you to discover and apply the appropriate documentation based on the specific context of each task, without overwhelming yourself with unnecessary information upfront.

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Documentation Team | Initial version |
| 1.1 | 2025-02-25 | Documentation Team | Removed structure overlap, added maintenance section |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
