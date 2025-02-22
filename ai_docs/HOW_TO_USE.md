# How to Use the Adaptive Development System

## Overview

This guide explains how to use our AI-driven development system effectively. The system adapts its requirements and checks based on the type and complexity of changes being made.

## Quick Start

1. Determine Change Configuration
```typescript
const config: WorkflowConfig = {
  changeType: 'feature', // feature, fix, docs, refactor
  complexity: 'medium',  // simple, medium, complex
  urgency: 'normal',    // normal, urgent
  scope: {
    affects: ['ui'],
    testingRequired: ['unit', 'integration']
  }
};
```

2. Create Branch
```bash
# For features
git checkout -b feature/my-feature dev

# For fixes
git checkout -b fix/issue-123 dev

# For docs
git checkout -b docs/component-api dev
```

3. Follow Workflow
- Check requirements in workflows/{type}.md
- Run quality checks from checks/
- Use AI prompts from prompts/

## Change Types

### Feature Development
1. Plan
   - Review feature.md workflow
   - Use prompts/feature/ templates
   - Define component structure

2. Implement
   - Follow TypeScript standards
   - Use Shadcn UI components
   - Write tests first

3. Review
   - Run quality checks
   - Use AI code review
   - Update documentation

### Bug Fixes
1. Analyze
   - Document reproduction steps
   - Identify root cause
   - Plan fix approach

2. Fix
   - Implement solution
   - Add regression tests
   - Update documentation

3. Verify
   - Run full test suite
   - Check performance impact
   - Update changelog

### Documentation
1. Plan
   - Identify documentation needs
   - Choose documentation type
   - Select template

2. Write
   - Follow documentation standards
   - Include code examples
   - Add type information

3. Review
   - Verify accuracy
   - Check completeness
   - Update references

## Quality Gates

### Development Gate
```bash
# Run type checks
npm run typecheck

# Run unit tests
npm run test:unit

# Check coverage
npm run test:coverage
```

### Integration Gate
```bash
# Run integration tests
npm run test:integration

# Check performance
npm run test:performance

# Verify build
npm run build
```

### Production Gate
```bash
# Run E2E tests
npm run test:e2e

# Security scan
npm run security:audit

# Build production
npm run build:production
```

## AI Assistance

### Using AI Prompts
1. Choose appropriate prompt template
2. Provide context about the change
3. Follow AI suggestions
4. Verify results

### Code Review
1. Use prompts/review/code-review.md
2. Follow review checklist
3. Address AI feedback
4. Verify fixes

## Common Workflows

### New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-component dev

# 2. Review requirements
cat ai_docs/workflows/feature.md

# 3. Use AI prompts
cat ai_docs/prompts/feature/component.md

# 4. Implement with tests
npm run test:watch

# 5. Run quality checks
npm run check:all

# 6. Create PR
gh pr create
```

### Bug Fix
```bash
# 1. Create fix branch
git checkout -b fix/issue-123 dev

# 2. Review requirements
cat ai_docs/workflows/fix.md

# 3. Implement fix
npm run test:watch

# 4. Verify fix
npm run test:all

# 5. Create PR
gh pr create
```

## Tips & Best Practices

1. Always start with configuration
- Define change type
- Assess complexity
- Determine scope

2. Use appropriate templates
- Check workflow docs
- Use AI prompts
- Follow checklists

3. Run checks early
- Type checking
- Unit tests
- Linting

4. Review thoroughly
- Use AI review
- Check standards
- Verify changes

5. Document everything
- Update docs
- Add comments
- Write clear commits

## Troubleshooting

### Common Issues

1. Failed Quality Gates
- Review error messages
- Check requirements
- Run specific tests
- Update as needed

2. AI Assistance
- Provide more context
- Use specific prompts
- Verify suggestions
- Iterate if needed

3. Workflow Questions
- Check documentation
- Review examples
- Ask for help
- Update docs

## Support

- Review ai_docs/ directory
- Check workflow documentation
- Use AI assistance
- Update documentation

Remember: The system adapts to your changes. Always check the specific requirements for your change type and complexity level.
