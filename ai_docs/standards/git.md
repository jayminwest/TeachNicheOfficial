# Git & GitHub Standards

## Branch Structure
```
main (production)
  ↳ staging
    ↳ dev
      ↳ feature/*
      ↳ bugfix/*
      ↳ hotfix/*
      ↳ release/*
```

## Branch Naming Conventions

### Format
`<type>/<description>`

### Types
- `feature/` - New features (e.g., feature/video-upload)
- `bugfix/` - Non-critical fixes (e.g., bugfix/login-validation)
- `hotfix/` - Critical production fixes (e.g., hotfix/security-patch)
- `release/` - Release preparation (e.g., release/v1.2.0)
- `docs/` - Documentation updates (e.g., docs/api-reference)
- `refactor/` - Code refactoring (e.g., refactor/auth-flow)

### Description
- Use kebab-case
- Be concise but descriptive
- Include issue number if applicable (e.g., feature/video-upload-#123)

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting changes
- refactor: Code restructuring
- test: Adding/modifying tests
- chore: Maintenance tasks

### Guidelines
- Subject line limited to 72 characters
- Use present tense ("add feature" not "added feature")
- Body explains what and why, not how
- Reference issues in footer

### Examples
```
feat(auth): implement OAuth login with Google

Add Google OAuth authentication option to improve user signup experience.
Includes error handling and redirect flows.

Closes #123
```

## Pull Requests

### Title Format
`[Type] Description (#issue)`

### Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit Tests Added
- [ ] Integration Tests Added
- [ ] Manual Testing Completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] Tests passing
```

### Review Process
1. Self-review completed
2. Tests passing
3. Documentation updated
4. PR template filled
5. Requested reviewers
6. Addressed feedback

## Protected Branches

### Main Branch
- Requires pull request
- Requires approvals (2 minimum)
- Requires passing CI
- No direct pushes
- Linear history required

### Dev Branch
- Requires pull request
- Requires 1 approval
- Requires passing CI
- No direct pushes

## Common Workflows

### Feature Development
```bash
# Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# Regular commits
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feature/new-feature
```

### Bug Fixes
```bash
# Create bugfix branch
git checkout dev
git pull origin dev
git checkout -b bugfix/issue-123

# Fix and commit
git add .
git commit -m "fix(scope): description"

# Push and create PR
git push -u origin bugfix/issue-123
```

### Hotfixes
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Fix, commit, and push
git add .
git commit -m "fix(scope): description"
git push -u origin hotfix/critical-fix
```

## Best Practices

1. Keep branches short-lived
2. Rebase feature branches regularly
3. Write meaningful commit messages
4. Create focused, reviewable PRs
5. Delete merged branches
6. Keep linear history
7. Never force push to protected branches
8. Always pull before starting work

## Git Hooks

### Pre-commit
- Lint staged files
- Run type checks
- Run unit tests
- Check commit message format

### Pre-push
- Run full test suite
- Check build
- Verify branch naming

## Continuous Integration

### Checks Required
- Type checking
- Linting
- Unit tests
- Integration tests
- Build verification
- Coverage thresholds

### Automated Processes
- PR labeling
- Branch protection
- Status checks
- Deployment previews

## Release Process

1. Create release branch
```bash
git checkout dev
git checkout -b release/v1.0.0
```

2. Version bump and changelog
```bash
npm version 1.0.0
git add .
git commit -m "chore(release): v1.0.0"
```

3. Merge to main
```bash
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

4. Merge back to dev
```bash
git checkout dev
git merge release/v1.0.0
git push origin dev
```

## Troubleshooting

### Common Issues
1. Merge Conflicts
   - Pull latest changes
   - Rebase if necessary
   - Resolve conflicts locally
   - Test after resolution

2. Failed CI
   - Check logs
   - Run tests locally
   - Fix issues
   - Push updates

3. Branch Management
   - Keep branches updated
   - Delete stale branches
   - Use correct base branch
   - Follow naming conventions

## Support

- Review this documentation
- Check commit history
- Use PR templates
- Ask for help when needed
# Git Standards

This document outlines the Git workflow and standards for the Teach Niche platform, with an emphasis on our Test Driven Development (TDD) approach.

## Branch Strategy

### Main Branches

- **main**: Production-ready code
- **dev**: Integration branch for development work
- **staging**: Pre-production testing branch

### Feature Branches

All development work should be done in feature branches:

- **feature/[feature-name]**: For new features
- **fix/[issue-description]**: For bug fixes
- **refactor/[component-name]**: For code refactoring
- **docs/[document-name]**: For documentation updates
- **test/[test-description]**: For adding or updating tests

## Commit Standards

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Changes that do not affect code functionality (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or modifying tests
- **chore**: Changes to build process or auxiliary tools
- **perf**: Performance improvements

### TDD-Specific Commit Types

- **test**: Initial test implementation (Red phase)
- **feat** or **fix**: Implementation to make tests pass (Green phase)
- **refactor**: Code improvements while maintaining passing tests (Refactor phase)

### Examples

```
feat(auth): add two-factor authentication

test(payment): add tests for Stripe payment processing

fix(video): resolve playback issue on Safari browsers

refactor(dashboard): improve performance of analytics charts

docs(api): update API documentation with new endpoints
```

## Pull Request Process

### Creating Pull Requests

1. Create a feature branch from dev:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Develop using TDD approach:
   - Write tests first
   - Implement code to make tests pass
   - Refactor as needed

3. Commit changes following commit standards

4. Push branch to remote:
   ```bash
   git push -u origin feature/your-feature-name
   ```

5. Create a pull request to the dev branch

### Pull Request Requirements

All pull requests must:

1. Follow the TDD approach with tests written before implementation
2. Include appropriate tests for the changes
3. Pass all automated tests
4. Meet code quality standards
5. Be reviewed by at least one team member
6. Have no merge conflicts with the target branch

### Pull Request Template

```markdown
## Description
[Describe the changes made in this PR]

## Type of Change
- [ ] New feature (non-breaking change adding functionality)
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Refactor (code improvements without changing functionality)
- [ ] Documentation update

## Test Driven Development
- [ ] Tests were written before implementation
- [ ] All tests pass locally
- [ ] New tests cover the changes appropriately
- [ ] Includes tests for third-party API integrations (if applicable)

## How Has This Been Tested?
[Describe the testing process]

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## Code Review Standards

### Review Checklist

- Verify tests were written before implementation (TDD approach)
- Ensure all tests pass
- Check code quality and adherence to project standards
- Verify proper error handling
- Check for security vulnerabilities
- Ensure documentation is updated
- Verify third-party API integrations are properly tested

### Review Comments

- Be specific and clear
- Provide constructive feedback
- Reference relevant documentation or standards
- Suggest alternatives when appropriate
- Use a respectful tone

## Git Workflow Examples

### TDD Workflow Example

```bash
# Start a new feature
git checkout dev
git pull
git checkout -b feature/user-profile

# Write tests first (Red phase)
# Create tests for user profile functionality
git add .
git commit -m "test(profile): add tests for user profile component"

# Implement the feature (Green phase)
# Write code to make the tests pass
git add .
git commit -m "feat(profile): implement user profile component"

# Refactor the code (Refactor phase)
# Improve the implementation while keeping tests passing
git add .
git commit -m "refactor(profile): optimize profile data loading"

# Add tests for third-party integration
git add .
git commit -m "test(profile): add tests for Supabase profile data integration"

# Implement third-party integration
git add .
git commit -m "feat(profile): integrate with Supabase for profile data"

# Push changes and create PR
git push -u origin feature/user-profile
```

### Bug Fix Workflow Example

```bash
# Start a bug fix
git checkout dev
git pull
git checkout -b fix/payment-error

# Write tests that reproduce the bug (Red phase)
git add .
git commit -m "test(payment): add test reproducing payment processing error"

# Fix the bug (Green phase)
git add .
git commit -m "fix(payment): resolve payment processing error"

# Refactor if needed (Refactor phase)
git add .
git commit -m "refactor(payment): improve error handling in payment process"

# Push changes and create PR
git push -u origin fix/payment-error
```

## Handling Merge Conflicts

1. Pull the latest changes from the target branch:
   ```bash
   git checkout dev
   git pull
   git checkout your-feature-branch
   git merge dev
   ```

2. Resolve conflicts:
   - Identify conflicting files
   - Edit files to resolve conflicts
   - Run tests to ensure functionality is preserved
   - Commit the resolved conflicts

3. Push the resolved branch:
   ```bash
   git push
   ```

## Git Best Practices

1. **Commit Early and Often**: Make small, focused commits
2. **Write Meaningful Commit Messages**: Follow the commit message format
3. **Keep Branches Updated**: Regularly merge from the parent branch
4. **Delete Merged Branches**: Clean up after merging
5. **Use Pull Requests**: Never commit directly to main branches
6. **Write Tests First**: Follow the TDD approach
7. **Verify Tests Pass**: Ensure all tests pass before pushing
8. **Review Code**: All code should be reviewed before merging

## Git Hooks

We use Git hooks to enforce standards:

- **pre-commit**: Runs linting and formatting
- **pre-push**: Runs tests to ensure they pass before pushing
- **commit-msg**: Validates commit message format

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Development Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD approach |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
